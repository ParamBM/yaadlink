import { Head } from '@inertiajs/react';
import { ArrowRight, Layers3, ServerCog } from 'lucide-react';

import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const stack = ['React JS frontend', 'Tailwind CSS', 'shadcn/ui ready', 'Laravel API backend'];

export default function Welcome() {
    return (
        <>
            <Head title="Welcome" />

            <div className="min-h-screen bg-surface text-on-surface">
                <Header />

                <main className="pt-24">
                    <div className="bg-[radial-gradient(circle_at_top,_rgba(183,16,42,0.08),_transparent_45%),linear-gradient(180deg,_#fbf9f8_0%,_#f6f3f2_100%)] px-6 py-16 text-slate-950">
                        <div className="mx-auto flex max-w-6xl flex-col gap-10">
                            <section className="grid gap-8 rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur md:grid-cols-[1.3fr_0.7fr] md:p-12">
                                <div className="space-y-6">
                                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
                                        <Layers3 className="h-4 w-4" />
                                        JavaScript-only Inertia shell
                                    </div>

                                    <div className="space-y-4">
                                        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
                                            Laravel handles the APIs. React builds the interface.
                                        </h1>
                                        <p className="max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                                            The TypeScript starter has been trimmed down, while the Inertia entry flow stays in place for the
                                            initial route load.
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        {stack.map((item) => (
                                            <span
                                                key={item}
                                                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
                                            >
                                                {item}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <Button className="h-11 rounded-full px-6">
                                            Start building
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" className="h-11 rounded-full px-6">
                                            Add API endpoints
                                        </Button>
                                    </div>
                                </div>

                                <Card className="border-slate-200 bg-slate-950 text-slate-50 shadow-2xl">
                                    <CardHeader>
                                        <CardDescription className="text-slate-300">Starter structure</CardDescription>
                                        <CardTitle className="flex items-center gap-3 text-2xl text-white">
                                            <ServerCog className="h-6 w-6 text-cyan-300" />
                                            Clean base for the app
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 text-sm text-slate-300">
                                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                            <p className="font-medium text-white">Frontend</p>
                                            <p className="mt-2">
                                                `resources/js/app.jsx` boots Inertia and `resources/js/pages/welcome.jsx` is your first page.
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                            <p className="font-medium text-white">Backend</p>
                                            <p className="mt-2">Laravel keeps the initial route and stays ready for the API endpoints you build next.</p>
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                            <p className="font-medium text-white">UI</p>
                                            <p className="mt-2">Tailwind and shadcn utility files remain in place without the TypeScript starter clutter.</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </section>
                        </div>
                    </div>
                </main>

                <Footer />
            </div>
        </>
    );
}
