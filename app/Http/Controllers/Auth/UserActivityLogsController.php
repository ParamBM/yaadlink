<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class UserActivityLogsController extends Controller
{
    /* -----------------------------
     * Helpers (schema-safe columns)
     * ----------------------------- */
    private function pickCol(string $table, array $candidates): ?string
    {
        foreach ($candidates as $c) {
            if (Schema::hasColumn($table, $c)) return $c;
        }
        return null;
    }

    private function safeJsonDecode($val): array
    {
        if (!$val) return [];
        if (is_array($val)) return $val;
        if (is_object($val)) return (array)$val;
        try {
            $a = json_decode((string)$val, true);
            return is_array($a) ? $a : [];
        } catch (\Throwable $e) {
            return [];
        }
    }

    /**
     * Return a DB expression to extract a JSON key from a JSON column (best-effort by driver).
     * @param string $colRef e.g. "al.meta_json"
     * @param string $key e.g. "course_id"
     */
    private function jsonExtractExpr(string $colRef, string $key): ?\Illuminate\Database\Query\Expression
    {
        // key whitelist for safety
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $key)) return null;

        $driver = DB::getDriverName();

        // MySQL / MariaDB
        if ($driver === 'mysql' || $driver === 'mariadb') {
            return DB::raw("JSON_UNQUOTE(JSON_EXTRACT($colRef, '$.$key'))");
        }

        // PostgreSQL
        if ($driver === 'pgsql') {
            return DB::raw("($colRef::jsonb ->> '$key')");
        }

        // SQLite (if JSON1 enabled)
        if ($driver === 'sqlite') {
            return DB::raw("json_extract($colRef, '$.$key')");
        }

        return null;
    }

    /* =========================================================
     * GET /api/activity-logs
     *
     * Query params supported:
     * - page, per_page
     * - search (message/action/endpoint/module/table/row)
     * - name (actor name)
     * - role
     * - user_id (dropdown filter)
     * - batch_id, course_id
     * - modules (comma-separated)
     * - action (exact match - NEW)
     * - action_like (partial match)
     * - quiz_id, assignment_id, study_material_id, coding_question_id
     * - from=YYYY-MM-DD, to=YYYY-MM-DD
     * - sort=created_at, dir=asc|desc
     * ========================================================= */
    public function index(Request $request)
    {
        $page     = max(1, (int) $request->get('page', 1));
        $perPage  = (int) $request->get('per_page', 20);
        $perPage  = max(10, min(100, $perPage));

        $search      = trim((string) $request->get('search', ''));
        $name        = trim((string) $request->get('name', ''));
        $role        = trim((string) $request->get('role', ''));
        $userId      = (int) $request->get('user_id', 0);
        $batchId     = (int) $request->get('batch_id', 0);
        $courseId    = (int) $request->get('course_id', 0);
        
        // Action filters - exact and partial
        $action      = trim((string) $request->get('action', ''));      // NEW: exact match from dropdown
        $actionLike  = trim((string) $request->get('action_like', '')); // existing: partial match

        $quizId          = (int) $request->get('quiz_id', 0);
        $assignmentId    = (int) $request->get('assignment_id', 0);
        $studyMaterialId = (int) $request->get('study_material_id', 0);
        $codingQId       = (int) $request->get('coding_question_id', 0);

        $from = $request->get('from'); // YYYY-MM-DD
        $to   = $request->get('to');   // YYYY-MM-DD

        // modules from UI: "quizzes,courses,coding_tests,assignments,study_materials"
        $modulesRaw = trim((string) $request->get('modules', ''));
        $modules = array_values(array_filter(array_map('trim', explode(',', $modulesRaw))));

        // sort
        $sort = (string) $request->get('sort', 'created_at');
        $dir  = strtolower((string) $request->get('dir', 'desc')) === 'asc' ? 'asc' : 'desc';

        $sortWhitelist = [
            'created_at' => 'l.created_at',
            'module'     => 'l.module',
            'activity'   => 'l.activity',
            'role'       => 'l.performed_by_role',
        ];
        $sortCol = $sortWhitelist[$sort] ?? 'l.created_at';

        $driver = DB::getDriverName();

        // Determine which joins are needed based on filters and modules
        // ALWAYS join users - we need actor names for display
        $needUsers = true;
        $needAssignments = $assignmentId > 0 || in_array('assignments', $modules) || in_array('assignment', $modules);
        $needStudyMaterials = $studyMaterialId > 0 || in_array('study_materials', $modules) || in_array('study-materials', $modules) || in_array('materials', $modules) || in_array('study_material', $modules);
        $needQuizzes = $quizId > 0 || in_array('quizzes', $modules) || in_array('quiz', $modules) || in_array('quizz', $modules);
        $needCodingQuestions = $codingQId > 0 || in_array('coding_tests', $modules) || in_array('coding', $modules) || in_array('coding_questions', $modules);
        $needBatches = $batchId > 0 || $needAssignments || $needStudyMaterials || $needQuizzes || $needCodingQuestions;
        $needCourses = $courseId > 0 || $needBatches;

        // JSON extract helpers (MySQL default for XAMPP)
        if ($driver === 'mysql') {
            $jsonText = function(string $col, string $path) {
                // Validate path to prevent SQL injection
                if (!preg_match('/^[a-zA-Z0-9_]+$/', $path)) {
                    throw new \InvalidArgumentException("Invalid JSON path: $path");
                }
                return "NULLIF(JSON_UNQUOTE(JSON_EXTRACT($col, '$.$path')), '')";
            };
            $jsonInt = function(string $col, string $path) use ($jsonText) {
                return "CAST(" . $jsonText($col, $path) . " AS UNSIGNED)";
            };
        } else {
            // Basic fallback (Postgres json/jsonb)
            $jsonText = function(string $col, string $path) {
                // Validate path to prevent SQL injection
                if (!preg_match('/^[a-zA-Z0-9_]+$/', $path)) {
                    throw new \InvalidArgumentException("Invalid JSON path: $path");
                }
                return "NULLIF(($col->>'$path'),'')";
            };
            $jsonInt = function(string $col, string $path) use ($jsonText) {
                return "CAST(" . $jsonText($col, $path) . " AS BIGINT)";
            };
        }

        // Fallback ids from log JSON (old_values/new_values)
        $metaBatchIdExpr = "COALESCE(
            {$jsonInt('l.new_values','batch_id')},
            {$jsonInt('l.old_values','batch_id')},
            {$jsonInt('l.new_values','batchId')},
            {$jsonInt('l.old_values','batchId')}
        )";

        $metaCourseIdExpr = "COALESCE(
            {$jsonInt('l.new_values','course_id')},
            {$jsonInt('l.old_values','course_id')},
            {$jsonInt('l.new_values','courseId')},
            {$jsonInt('l.old_values','courseId')}
        )";

        $metaQuizIdExpr = "COALESCE(
            {$jsonInt('l.new_values','quiz_id')},
            {$jsonInt('l.old_values','quiz_id')},
            {$jsonInt('l.new_values','quizId')},
            {$jsonInt('l.old_values','quizId')}
        )";

        $metaAssignmentIdExpr = "COALESCE(
            {$jsonInt('l.new_values','assignment_id')},
            {$jsonInt('l.old_values','assignment_id')},
            {$jsonInt('l.new_values','assignmentId')},
            {$jsonInt('l.old_values','assignmentId')}
        )";

        $metaStudyMaterialIdExpr = "COALESCE(
            {$jsonInt('l.new_values','study_material_id')},
            {$jsonInt('l.old_values','study_material_id')},
            {$jsonInt('l.new_values','studyMaterialId')},
            {$jsonInt('l.old_values','studyMaterialId')}
        )";

        $metaCodingQIdExpr = "COALESCE(
            {$jsonInt('l.new_values','coding_question_id')},
            {$jsonInt('l.old_values','coding_question_id')},
            {$jsonInt('l.new_values','question_id')},
            {$jsonInt('l.old_values','question_id')}
        )";

        // Base query
        $q = DB::table('user_data_activity_log as l');

        // ALWAYS join users table - we need actor names
        $q->leftJoin('users as u', 'u.id', '=', 'l.performed_by');

        // Conditional joins for other tables
        if ($needAssignments) {
            $q->leftJoin('assignments as a', function($join) {
                $join->on('a.id', '=', 'l.record_id');
            });
        }

        if ($needStudyMaterials) {
            $q->leftJoin('study_materials as sm', function($join) {
                $join->on('sm.id', '=', 'l.record_id');
            });
        }

        if ($needQuizzes) {
            $q->leftJoin('quizz as qz', function($join) {
                $join->on('qz.id', '=', 'l.record_id');
            });
            $q->leftJoin('batch_quizzes as bq', function($join) {
                $join->on('bq.id', '=', 'l.record_id');
            });
            $q->leftJoin('quizz as qz2', function($join) {
                $join->on('qz2.id', '=', 'bq.quiz_id');
            });
        }

        if ($needCodingQuestions) {
            $q->leftJoin('coding_questions as cq', function($join) {
                $join->on('cq.id', '=', 'l.record_id');
            });
            $q->leftJoin('batch_coding_questions as bcq', function($join) {
                $join->on('bcq.id', '=', 'l.record_id');
            });
            $q->leftJoin('coding_questions as cq2', function($join) {
                $join->on('cq2.id', '=', 'bcq.question_id');
            });
        }

        // Build batch resolution expression
        $batchParts = [$metaBatchIdExpr];
        if ($needAssignments) array_unshift($batchParts, 'a.batch_id');
        if ($needStudyMaterials) array_unshift($batchParts, 'sm.batch_id');
        if ($needQuizzes) array_unshift($batchParts, 'bq.batch_id');
        if ($needCodingQuestions) array_unshift($batchParts, 'bcq.batch_id');
        
        $resolvedBatchIdExpr = "COALESCE(" . implode(", ", $batchParts) . ")";

        if ($needBatches) {
            $q->leftJoin('batches as b', function($join) use ($resolvedBatchIdExpr) {
                $join->on('b.id', '=', DB::raw($resolvedBatchIdExpr));
            });
        }

        // Build course resolution expression
        $courseParts = [$metaCourseIdExpr];
        if ($needAssignments) array_unshift($courseParts, 'a.course_id');
        if ($needStudyMaterials) array_unshift($courseParts, 'sm.course_id');
        if ($needBatches) array_unshift($courseParts, 'b.course_id');
        
        $resolvedCourseIdExpr = "COALESCE(" . implode(", ", $courseParts) . ")";

        if ($needCourses) {
            $q->leftJoin('courses as c', function($join) use ($resolvedCourseIdExpr) {
                $join->on('c.id', '=', DB::raw($resolvedCourseIdExpr));
            });
        }

        // Select fields - ALWAYS include user name/email since we always join
        $selectFields = [
            'l.id',
            'l.performed_by',
            'l.performed_by_role',
            'l.ip',
            'l.user_agent',
            'l.activity',
            'l.module',
            'l.table_name',
            'l.record_id',
            'l.changed_fields',
            'l.old_values',
            'l.new_values',
            'l.log_note',
            'l.created_at',
            
            // Always include user info
            DB::raw("u.name as performed_by_name"),
            DB::raw("u.email as performed_by_email"),
        ];

        if ($needBatches) {
            $selectFields[] = DB::raw("$resolvedBatchIdExpr as batch_id");
            $selectFields[] = DB::raw("b.badge_title as batch_name");
        } else {
            $selectFields[] = DB::raw("$metaBatchIdExpr as batch_id");
            $selectFields[] = DB::raw("NULL as batch_name");
        }

        if ($needCourses) {
            $selectFields[] = DB::raw("$resolvedCourseIdExpr as course_id");
            $selectFields[] = DB::raw("c.title as course_name");
        } else {
            $selectFields[] = DB::raw("$metaCourseIdExpr as course_id");
            $selectFields[] = DB::raw("NULL as course_name");
        }

        if ($needQuizzes) {
            $selectFields[] = DB::raw("COALESCE(qz.id, qz2.id, $metaQuizIdExpr) as quiz_id");
            $selectFields[] = DB::raw("COALESCE(qz.quiz_name, qz2.quiz_name) as quiz_name");
        } else {
            $selectFields[] = DB::raw("$metaQuizIdExpr as quiz_id");
            $selectFields[] = DB::raw("NULL as quiz_name");
        }

        if ($needAssignments) {
            $selectFields[] = DB::raw("COALESCE(a.id, $metaAssignmentIdExpr) as assignment_id");
            $selectFields[] = DB::raw("a.title as assignment_title");
        } else {
            $selectFields[] = DB::raw("$metaAssignmentIdExpr as assignment_id");
            $selectFields[] = DB::raw("NULL as assignment_title");
        }

        if ($needStudyMaterials) {
            $selectFields[] = DB::raw("COALESCE(sm.id, $metaStudyMaterialIdExpr) as study_material_id");
            $selectFields[] = DB::raw("sm.title as study_material_title");
        } else {
            $selectFields[] = DB::raw("$metaStudyMaterialIdExpr as study_material_id");
            $selectFields[] = DB::raw("NULL as study_material_title");
        }

        if ($needCodingQuestions) {
            $selectFields[] = DB::raw("COALESCE(cq.id, cq2.id, $metaCodingQIdExpr) as coding_question_id");
            $selectFields[] = DB::raw("COALESCE(cq.title, cq2.title) as coding_question_title");
        } else {
            $selectFields[] = DB::raw("$metaCodingQIdExpr as coding_question_id");
            $selectFields[] = DB::raw("NULL as coding_question_title");
        }

        $q->select($selectFields);

        // =========================
        // Filters
        // =========================
        if ($role !== '') {
            $q->where('l.performed_by_role', $role);
        }

        if ($userId > 0) {
            $q->where('l.performed_by', $userId);
        }

        if ($name !== '') {
            $q->where(function($w) use ($name) {
                $w->where('u.name', 'like', "%{$name}%")
                  ->orWhere('u.email', 'like', "%{$name}%");
            });
        }

        if (!empty($modules)) {
            // allow small alias mapping
            $map = [
                'quizzes'         => ['quizzes','quiz','quizz'],
                'courses'         => ['courses','course'],
                'coding_tests'    => ['coding_tests','coding','coding_questions'],
                'assignments'     => ['assignments','assignment'],
                'study_materials' => ['study_materials','study-materials','materials','study_material'],
                'users'           => ['users','user'],
            ];

            $expanded = [];
            foreach ($modules as $m) {
                if (isset($map[$m])) $expanded = array_merge($expanded, $map[$m]);
                else $expanded[] = $m;
            }
            $expanded = array_values(array_unique($expanded));

            $q->whereIn('l.module', $expanded);
        }

        // NEW: Exact action match (from dropdown)
        if ($action !== '') {
            $q->where('l.activity', $action);
        }

        // Partial action match (from text input) - only if exact match not set
        if ($actionLike !== '' && $action === '') {
            $q->where('l.activity', 'like', "%{$actionLike}%");
        }

        if ($batchId > 0) {
            $q->whereRaw("($resolvedBatchIdExpr) = ?", [$batchId]);
        }

        if ($courseId > 0) {
            $q->whereRaw("($resolvedCourseIdExpr) = ?", [$courseId]);
        }

        if ($quizId > 0) {
            if ($needQuizzes) {
                $q->whereRaw("(COALESCE(qz.id, qz2.id, $metaQuizIdExpr)) = ?", [$quizId]);
            } else {
                $q->whereRaw("($metaQuizIdExpr) = ?", [$quizId]);
            }
        }

        if ($assignmentId > 0) {
            if ($needAssignments) {
                $q->whereRaw("(COALESCE(a.id, $metaAssignmentIdExpr)) = ?", [$assignmentId]);
            } else {
                $q->whereRaw("($metaAssignmentIdExpr) = ?", [$assignmentId]);
            }
        }

        if ($studyMaterialId > 0) {
            if ($needStudyMaterials) {
                $q->whereRaw("(COALESCE(sm.id, $metaStudyMaterialIdExpr)) = ?", [$studyMaterialId]);
            } else {
                $q->whereRaw("($metaStudyMaterialIdExpr) = ?", [$studyMaterialId]);
            }
        }

        if ($codingQId > 0) {
            if ($needCodingQuestions) {
                $q->whereRaw("(COALESCE(cq.id, cq2.id, $metaCodingQIdExpr)) = ?", [$codingQId]);
            } else {
                $q->whereRaw("($metaCodingQIdExpr) = ?", [$codingQId]);
            }
        }

        if (!empty($from)) {
            $q->whereDate('l.created_at', '>=', $from);
        }
        if (!empty($to)) {
            $q->whereDate('l.created_at', '<=', $to);
        }

        if ($search !== '') {
            $q->where(function($w) use ($search) {
                $w->where('l.activity', 'like', "%{$search}%")
                  ->orWhere('l.module', 'like', "%{$search}%")
                  ->orWhere('l.table_name', 'like', "%{$search}%")
                  ->orWhere('l.log_note', 'like', "%{$search}%")
                  ->orWhere('u.name', 'like', "%{$search}%")
                  ->orWhere('u.email', 'like', "%{$search}%");
            });
        }

        // =========================
        // Ordering + Pagination
        // =========================
        $q->orderBy($sortCol, $dir);

        $p = $q->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $p->items(),
            'pagination' => [
                'page'      => $p->currentPage(),
                'per_page'  => $p->perPage(),
                'total'     => $p->total(),
                'last_page' => $p->lastPage(),
            ]
        ]);
    }
}