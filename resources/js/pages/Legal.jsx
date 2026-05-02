import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router';

export default function Legal() {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('terms');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        if (location.hash === '#privacy') setActiveTab('privacy');
        else setActiveTab('terms');
    }, [location.hash]);

    const switchTab = (tab) => {
        setActiveTab(tab);
        navigate(tab === 'privacy' ? '/legal#privacy' : '/legal', { replace: true });
    };

    return (
        <div className="min-h-screen bg-surface">
            {/* Hero */}
            <div className="relative overflow-hidden bg-surface-container-low py-20">
                <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-primary-container/10 blur-[80px]" />
                <div className="absolute right-[-4rem] bottom-0 h-72 w-72 rounded-full bg-secondary-fixed/20 blur-[80px]" />
                <div className={`relative z-10 mx-auto max-w-4xl px-6 text-center transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
                    <span className="mb-4 inline-block rounded-full bg-secondary-fixed px-4 py-1.5 font-label text-sm font-semibold text-on-secondary-fixed">
                        Legal
                    </span>
                    <h1 className="mb-4 font-headline text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl">
                        Transparency &amp; Trust
                    </h1>
                    <p className="mx-auto max-w-xl font-body text-lg leading-relaxed text-on-surface-variant">
                        We believe in clear, honest policies. Read how we protect your content, your privacy, and your rights.
                    </p>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="sticky top-0 z-20 border-b border-outline-variant/20 bg-surface/90 backdrop-blur-md">
                <div className="mx-auto flex max-w-4xl gap-2 px-6 py-3">
                    <button
                        id="tab-terms"
                        onClick={() => switchTab('terms')}
                        className={`flex items-center gap-2 rounded-full px-5 py-2.5 font-label text-sm font-semibold transition-all duration-200 ${
                            activeTab === 'terms'
                                ? 'bg-primary text-on-primary shadow-[0_4px_12px_rgba(183,16,42,0.25)]'
                                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                        }`}
                    >
                        <span className="material-symbols-outlined text-base">gavel</span>
                        Terms &amp; Conditions
                    </button>
                    <button
                        id="tab-privacy"
                        onClick={() => switchTab('privacy')}
                        className={`flex items-center gap-2 rounded-full px-5 py-2.5 font-label text-sm font-semibold transition-all duration-200 ${
                            activeTab === 'privacy'
                                ? 'bg-primary text-on-primary shadow-[0_4px_12px_rgba(183,16,42,0.25)]'
                                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                        }`}
                    >
                        <span className="material-symbols-outlined text-base">shield</span>
                        Privacy Policy
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="mx-auto max-w-4xl px-6 py-12 pb-24">
                {/* Draft banner */}
                <div className="mb-8 flex items-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-low px-5 py-4">
                    <span className="material-symbols-outlined text-xl text-primary">edit_document</span>
                    <p className="font-body text-sm text-on-surface-variant">
                        <strong className="text-on-surface">Draft document.</strong> Effective date and jurisdiction details will be updated before launch. Last reviewed: May 2026.
                    </p>
                </div>

                {activeTab === 'terms' ? <TermsContent /> : <PrivacyContent />}
            </div>
        </div>
    );
}

/* ─── Shared primitives ─────────────────────────────────────────── */

function Section({ num, title, badge, children }) {
    return (
        <div className="scroll-mt-24">
            <div className="mb-4 flex items-center gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-headline text-sm font-bold text-primary">
                    {num}
                </div>
                <h2 className="font-headline text-xl font-bold text-on-surface">
                    {title}
                    {badge && (
                        <span className="ml-3 inline-block rounded-full bg-primary/10 px-3 py-0.5 font-label text-xs font-semibold text-primary">
                            {badge}
                        </span>
                    )}
                </h2>
            </div>
            <div className="ml-13 space-y-4 pl-1 font-body text-[0.95rem] leading-relaxed text-on-surface-variant">
                {children}
            </div>
            <hr className="my-8 border-outline-variant/20" />
        </div>
    );
}

function Highlight({ children }) {
    return (
        <div className="rounded-2xl border-l-4 border-primary/40 bg-primary/5 px-5 py-4 font-body text-sm leading-relaxed text-on-surface">
            {children}
        </div>
    );
}

function Danger({ children }) {
    return (
        <div className="rounded-2xl border-l-4 border-error/60 bg-error/5 px-5 py-4 font-body text-sm leading-relaxed text-on-surface">
            <span className="mr-2 font-semibold text-error">⚠</span>
            {children}
        </div>
    );
}

function InfoBox({ children }) {
    return (
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container px-5 py-4 font-body text-sm leading-relaxed text-on-surface-variant">
            <span className="mr-2 font-semibold text-tertiary">ℹ</span>
            {children}
        </div>
    );
}

function UL({ items }) {
    return (
        <ul className="ml-4 space-y-2">
            {items.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                    <span className="material-symbols-outlined mt-0.5 text-sm text-primary/60">arrow_right</span>
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );
}

/* ─── Terms Content ─────────────────────────────────────────────── */

function TermsContent() {
    return (
        <div className="space-y-0">
            <div className="mb-8">
                <h1 className="font-headline text-3xl font-extrabold text-on-surface">Terms &amp; Conditions</h1>
                <p className="mt-2 font-body text-sm text-on-surface-variant">
                    Effective date: [INSERT DATE] · Last updated: [INSERT DATE] · Applies to: yaadlink.com and all subdomains
                </p>
            </div>

            <Section num="1" title="Acceptance of terms">
                <p>By accessing or using YaadLink ("the Platform", "we", "our", or "us"), creating an account, publishing a story, or uploading any content, you ("User", "you") agree to be bound by these Terms &amp; Conditions ("Terms"). If you do not agree to all of these Terms, you must not use YaadLink.</p>
                <p>These Terms constitute a legally binding agreement. We reserve the right to modify them at any time. Continued use of the Platform after changes are posted constitutes acceptance of the revised Terms.</p>
            </Section>

            <Section num="2" title="Eligibility &amp; account registration">
                <p>You must be at least 13 years of age to use YaadLink. If you are under 18, you confirm you have parental or guardian consent. By registering, you represent that all information you provide is accurate, current, and complete.</p>
                <UL items={[
                    'You are responsible for maintaining the confidentiality of your account credentials.',
                    'You are responsible for all activity that occurs under your account.',
                    'You must notify us immediately at legal@yaadlink.com of any unauthorised use of your account.',
                    'One person or legal entity may not maintain more than one account. Duplicate accounts may be terminated without notice.',
                ]} />
            </Section>

            <Section num="3" title="User-generated content — ownership &amp; licence">
                <p><strong className="text-on-surface">You retain ownership</strong> of all original content you create and upload to YaadLink, including story text, milestone descriptions, and personally written narratives, subject to the licence grant below.</p>
                <Highlight>By uploading any content — including photographs, images, text, or media files — to YaadLink, you grant YaadLink a worldwide, non-exclusive, royalty-free, sublicensable licence to store, display, reproduce, distribute, and make available that content solely for the purpose of operating the Platform and rendering your published story pages to viewers.</Highlight>
                <p>This licence exists only to allow us to host and display your content. We do not claim ownership of content you upload. You remain the copyright holder. This licence terminates when you delete your content or close your account, subject to any legal retention obligations.</p>
                <UL items={[
                    'You represent that you own or have the necessary rights, licences, and permissions for all content you upload.',
                    'You are solely responsible for ensuring you have the right to use photographs of third parties, including obtaining their consent where required by applicable law.',
                    'Story content enhanced by our AI tool is derived from your original input. You own the enhanced output; however, AI-generated additions are not independently authored by you and you accept responsibility for reviewing the final content before publishing.',
                ]} />
            </Section>

            <Section num="4" title="Prohibited content &amp; conduct" badge="Important">
                <Danger>Uploading, publishing, or transmitting any of the following content is strictly prohibited and will result in immediate account termination without refund, and may result in reporting to relevant law enforcement authorities.</Danger>
                <p>You must not upload, share, or make available any content that:</p>
                <UL items={[
                    'Contains nudity, sexually explicit material, or pornographic content of any kind.',
                    'Depicts, promotes, or facilitates sexual exploitation of minors (CSAM) — we have zero tolerance and are legally required to report such content.',
                    'Constitutes obscene, lewd, lascivious, or graphic sexual material.',
                    'Depicts graphic violence, gore, mutilation, or gratuitous harm to persons or animals.',
                    'Is defamatory, harassing, abusive, threatening, or discriminatory on the basis of race, gender, religion, nationality, disability, sexual orientation, or age.',
                    'Infringes any copyright, trademark, trade secret, patent, or other intellectual property right of any third party.',
                    'Violates any individual\'s right to privacy, including uploading images of identifiable individuals without their consent.',
                    'Contains misinformation, fake events, or fabricated memorial content intended to deceive.',
                    'Includes spam, bulk unsolicited messages, or phishing content.',
                    'Contains malicious code, viruses, or any software designed to harm or disrupt systems.',
                    'Advertises or promotes competing services without prior written authorisation from YaadLink.',
                ]} />
                <p>YaadLink reserves the right — but not the obligation — to review, flag, remove, or refuse to display any content at our sole discretion, without prior notice, and without liability to you.</p>
            </Section>

            <Section num="5" title="Image uploads — specific terms">
                <p>YaadLink allows you to upload photographs and images as cover images, gallery items, and milestone visuals. By uploading any image, you confirm that:</p>
                <UL items={[
                    'You are the original photographer, the copyright owner, or hold an explicit licence permitting you to use and publish the image online.',
                    'All identifiable persons depicted in uploaded images have consented to their image being displayed publicly on the internet.',
                    'The image does not depict minors in any way that could be considered exploitative, inappropriate, or contrary to child protection laws.',
                    'The image was not obtained through deception, trespass, or any unlawful means.',
                    'You indemnify YaadLink against any claims brought by third parties in relation to images you upload.',
                ]} />
                <InfoBox>Images uploaded to YaadLink are stored on our servers and may be served via third-party CDN infrastructure. While we take reasonable measures to protect stored images, we cannot guarantee absolute security. Do not upload images containing sensitive personal information (e.g. identity documents, medical records, financial details).</InfoBox>
                <p>We reserve the right to remove any image we determine — in our sole discretion — to be offensive, inappropriate, in violation of these Terms, or harmful to the YaadLink community, without prior notice.</p>
            </Section>

            <Section num="6" title="AI-assisted story enhancement">
                <p>YaadLink offers an optional AI story enhancement feature powered by Google Gemini. By using this feature:</p>
                <UL items={[
                    'Your story text, names, and contextual details you provide are transmitted to Google\'s Gemini API for processing. Refer to Google\'s privacy policy regarding data handling at ai.google.dev.',
                    'You are responsible for reviewing AI-generated content before publishing. YaadLink does not warrant the accuracy, appropriateness, or completeness of AI-generated content.',
                    'You must not use the AI feature to generate content that violates Section 4 of these Terms.',
                    'AI enhancement does not create a co-authorship relationship with YaadLink. You are the sole author and are responsible for all published content.',
                ]} />
            </Section>

            <Section num="7" title="Published stories &amp; public visibility">
                <p>By default, stories you create are published publicly and accessible to anyone with the unique story URL. You acknowledge and agree that:</p>
                <UL items={[
                    'Published stories are indexed by search engines unless you configure otherwise.',
                    'Third parties may share, screenshot, or otherwise distribute content from your public story page.',
                    'YaadLink cannot control downstream use of content once it has been publicly accessible online.',
                    'You may unpublish or delete your story at any time via your dashboard, but we cannot guarantee removal from cached copies, search engine indexes, or third-party archives.',
                ]} />
            </Section>

            <Section num="8" title="Intellectual property of YaadLink">
                <p>All elements of the YaadLink Platform — including but not limited to the software, code, UI design, themes, branding, logos, trademarks, and visual design — are the exclusive property of YaadLink or its licensors. You may not copy, reproduce, modify, distribute, or create derivative works from any part of the Platform without our express written consent.</p>
                <p>The YaadLink name, logo, and related marks are trademarks. Unauthorised use of these marks is strictly prohibited.</p>
            </Section>

            <Section num="9" title="Service availability &amp; modifications">
                <p>YaadLink is provided on an "as is" and "as available" basis. We do not guarantee uninterrupted, error-free, or secure access to the Platform. We reserve the right to:</p>
                <UL items={[
                    'Modify, suspend, or discontinue any part of the Platform at any time without notice.',
                    'Impose limits on certain features or restrict access to parts of the Platform.',
                    'Change pricing for premium features with reasonable prior notice.',
                ]} />
            </Section>

            <Section num="10" title="Disclaimers &amp; limitation of liability">
                <p>To the maximum extent permitted by law, YaadLink, its directors, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of data, loss of revenue, reputational harm, or loss of content, arising from your use of the Platform.</p>
                <p>Our total liability to you for any claim arising from use of the Platform shall not exceed the greater of (a) the total amount you paid to YaadLink in the three months preceding the claim, or (b) INR 500.</p>
                <Highlight>YaadLink is not responsible for the accuracy, completeness, or legality of user-generated content published on the Platform. Each user is solely responsible for content they create and publish.</Highlight>
            </Section>

            <Section num="11" title="Indemnification">
                <p>You agree to defend, indemnify, and hold harmless YaadLink and its affiliates from and against any claims, liabilities, damages, losses, and expenses — including legal fees — arising from or in any way connected with: (a) your use of the Platform; (b) your violation of these Terms; (c) content you upload or publish; (d) your infringement of any intellectual property or privacy rights of a third party.</p>
            </Section>

            <Section num="12" title="Termination">
                <p>We reserve the right to suspend or terminate your account and access to the Platform at any time, with or without notice, for any reason including but not limited to violation of these Terms. Upon termination:</p>
                <UL items={[
                    'Your published stories will be unpublished and your account data may be deleted.',
                    'Any licence you granted us to your content terminates, subject to any legal retention obligations.',
                    'You may request a data export within 30 days of termination by emailing privacy@yaadlink.com.',
                ]} />
                <p>You may close your account at any time by contacting us. Closure does not automatically entitle you to a refund of any fees paid.</p>
            </Section>

            <Section num="13" title="Governing law &amp; disputes">
                <p>These Terms are governed by the laws of India. Any disputes arising from these Terms or your use of the Platform shall be subject to the exclusive jurisdiction of the courts of [INSERT CITY], India. Prior to initiating legal proceedings, you agree to attempt to resolve disputes in good faith by contacting us at legal@yaadlink.com.</p>
            </Section>

            <Section num="14" title="Contact">
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
                    {[
                        { label: 'Legal enquiries', email: 'legal@yaadlink.com' },
                        { label: 'Content removal', email: 'support@yaadlink.com' },
                        { label: 'Account issues', email: 'support@yaadlink.com' },
                    ].map(({ label, email }) => (
                        <a
                            key={label}
                            href={`mailto:${email}`}
                            className="flex items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container-lowest px-4 py-2 font-label text-sm text-primary transition-colors hover:bg-surface-container-low"
                        >
                            <span className="material-symbols-outlined text-sm">mail</span>
                            <span className="text-on-surface-variant">{label}:</span> {email}
                        </a>
                    ))}
                </div>
            </Section>
        </div>
    );
}

/* ─── Privacy Content ───────────────────────────────────────────── */

function PrivacyContent() {
    return (
        <div className="space-y-0">
            <div className="mb-8">
                <h1 className="font-headline text-3xl font-extrabold text-on-surface">Privacy Policy</h1>
                <p className="mt-2 font-body text-sm text-on-surface-variant">
                    Effective date: [INSERT DATE] · Last updated: [INSERT DATE] · Applies to: yaadlink.com and all subdomains
                </p>
            </div>

            <Section num="1" title="Who we are &amp; scope">
                <p>YaadLink ("we", "us", "our") operates the YaadLink platform at yaadlink.com, a story-creation and milestone-sharing service. This Privacy Policy explains what personal data we collect, why we collect it, how we use and protect it, and your rights in relation to it.</p>
                <p>This policy applies to all users of the Platform, including visitors, registered users, and any person whose image or data appears in content published on the Platform.</p>
            </Section>

            <Section num="2" title="Data we collect">
                <p><strong className="text-on-surface">Account information:</strong> When you register, we collect your full name, email address, phone number (optional), hashed password, and profile image (if provided).</p>
                <p><strong className="text-on-surface">OAuth data:</strong> If you sign in via Google, we receive your Google ID, name, email address, and profile picture URL from Google's API. We do not receive your Google password.</p>
                <p><strong className="text-on-surface">Story content:</strong> Text you write, images you upload, milestone details, dates, and any other content you add to your story pages.</p>
                <p><strong className="text-on-surface">AI feature inputs:</strong> When you use the AI story enhancement feature, your story text and contextual fields are transmitted to Google Gemini's API for processing.</p>
                <p><strong className="text-on-surface">Usage &amp; technical data:</strong> We collect activity logs including login, create, update, delete actions, IP address, user agent, timestamps, and pages visited.</p>
                <p><strong className="text-on-surface">Visitor analytics:</strong> We assign anonymous visitor IDs (stored in localStorage) to track page views on published stories. No cross-site tracking is performed.</p>
                <p><strong className="text-on-surface">Payment data:</strong> Payment processing is handled by third-party providers. We do not store card details.</p>
            </Section>

            <Section num="3" title="Legal basis &amp; purpose of processing">
                <UL items={[
                    'Contract performance: Processing your account data and story content to provide the service you signed up for.',
                    'Legitimate interest: Activity logging for security, fraud prevention, abuse detection, and platform integrity monitoring.',
                    'Consent: Optional features such as AI enhancement, which you explicitly activate.',
                    'Legal obligation: Retaining certain records as required by applicable law, including reporting illegal content to authorities.',
                ]} />
            </Section>

            <Section num="4" title="How we use your data">
                <UL items={[
                    'To create and manage your account and authenticate your identity.',
                    'To render, host, and serve your published story pages to viewers.',
                    'To process AI enhancement requests via the Google Gemini API.',
                    'To display view counts on your stories using anonymised visitor tracking.',
                    'To send transactional communications (account creation confirmation, password reset, service updates).',
                    'To detect, investigate, and prevent fraud, abuse, illegal content, and Terms violations.',
                    'To maintain security audit logs for platform integrity.',
                    'To improve the Platform through aggregated, anonymised analytics.',
                    'To comply with legal obligations, including responding to valid law enforcement requests.',
                ]} />
                <InfoBox>We do not sell your personal data to third parties. We do not serve third-party advertising. We do not use your story content to train our own AI models.</InfoBox>
            </Section>

            <Section num="5" title="Uploaded images &amp; media">
                <p>Images you upload are stored on our servers and may be served via third-party CDN infrastructure (e.g. Cloudinary or equivalent) for performance. By uploading images:</p>
                <UL items={[
                    'Your images are stored on secure servers in [INSERT REGION].',
                    'Cover images and gallery images are publicly accessible if your story is published.',
                    'Images associated with deleted stories are removed from our storage within 30 days of deletion.',
                    'We do not perform facial recognition or biometric analysis on uploaded images.',
                    'We do not share your images with third parties except as necessary to render your story pages (e.g. CDN delivery).',
                ]} />
                <Danger>If an uploaded image is reported as illegal content (CSAM or otherwise unlawful), we are required by law to preserve a copy for law enforcement purposes and to report it to relevant authorities, regardless of any deletion request.</Danger>
            </Section>

            <Section num="6" title="Data sharing &amp; third parties">
                <p>We share your data with third parties only in the following circumstances:</p>
                <UL items={[
                    'Google Gemini API: Story text fields are sent to Google for AI enhancement when you use that feature.',
                    'Google OAuth: Authentication data exchange when you sign in via Google.',
                    'Cloud infrastructure: Hosting providers process data on our behalf under data processing agreements.',
                    'CDN providers: Media files may be delivered via CDN partners for performance.',
                    'Law enforcement: We will disclose data when required by valid legal process, court order, or when necessary to protect safety.',
                    'Business transfer: In the event of a merger, acquisition, or sale of assets, user data may be transferred. We will notify you in advance.',
                ]} />
            </Section>

            <Section num="7" title="Data retention">
                <UL items={[
                    'Account data: Retained for the duration of your account plus 90 days after closure, then deleted.',
                    'Story content & images: Deleted within 30 days of story deletion or account closure.',
                    'Activity logs: Retained for 12 months for security and fraud investigation purposes.',
                    'Legal hold data: Retained for as long as required by law or active legal proceedings.',
                    'Anonymised analytics: May be retained indefinitely as they cannot be linked to an individual.',
                ]} />
            </Section>

            <Section num="8" title="Your rights">
                <p>Subject to applicable law, you have the following rights regarding your personal data:</p>
                <UL items={[
                    'Access: Request a copy of the personal data we hold about you.',
                    'Correction: Request correction of inaccurate data.',
                    'Deletion: Request deletion of your account and associated personal data.',
                    'Data portability: Request an export of your story data in a machine-readable format.',
                    'Objection: Object to processing of your data for legitimate interest purposes.',
                    'Withdrawal of consent: Withdraw consent for optional processing (e.g. AI features) at any time.',
                    'Content removal from public pages: Request removal of a published story or specific images.',
                ]} />
                <p>To exercise any of these rights, email <a href="mailto:privacy@yaadlink.com" className="text-primary hover:underline">privacy@yaadlink.com</a>. We will respond within 30 days. Identity verification may be required before we process your request.</p>
            </Section>

            <Section num="9" title="Security">
                <p>We implement industry-standard technical and organisational measures to protect your data, including:</p>
                <UL items={[
                    'HTTPS encryption for all data in transit.',
                    'Hashed and salted password storage (never stored in plaintext).',
                    'Token-based authentication using rotating access tokens.',
                    'Role-based access controls limiting internal staff access to personal data.',
                    'Activity audit logging for all sensitive operations.',
                ]} />
                <p>No system is 100% secure. In the event of a data breach affecting your personal data, we will notify you in accordance with applicable law.</p>
            </Section>

            <Section num="10" title="Cookies &amp; local storage">
                <p>YaadLink uses session tokens stored in sessionStorage for authentication. We use localStorage to store an anonymous visitor ID for view-count tracking. We do not use third-party advertising cookies. We do not use tracking pixels.</p>
                <p>If you use Google Sign-In, Google may set its own cookies. Refer to Google's cookie policy for details.</p>
            </Section>

            <Section num="11" title="Children's privacy">
                <p>YaadLink is not directed at children under 13. We do not knowingly collect personal data from children under 13. If we become aware that we have collected data from a child under 13 without verifiable parental consent, we will delete that data promptly. If you believe a child under 13 has provided us with personal data, contact <a href="mailto:privacy@yaadlink.com" className="text-primary hover:underline">privacy@yaadlink.com</a> immediately.</p>
            </Section>

            <Section num="12" title="Changes to this policy">
                <p>We may update this Privacy Policy from time to time. We will notify you of material changes by posting a notice on the Platform and, where appropriate, by email. The "last updated" date at the top of this policy reflects the most recent revision. Continued use of the Platform after changes constitute acceptance of the revised policy.</p>
            </Section>

            <Section num="13" title="Contact &amp; complaints">
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
                    {[
                        { label: 'Privacy enquiries', email: 'privacy@yaadlink.com' },
                        { label: 'Data deletion', email: 'privacy@yaadlink.com' },
                        { label: 'Legal notices', email: 'legal@yaadlink.com' },
                    ].map(({ label, email }) => (
                        <a
                            key={label}
                            href={`mailto:${email}`}
                            className="flex items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container-lowest px-4 py-2 font-label text-sm text-primary transition-colors hover:bg-surface-container-low"
                        >
                            <span className="material-symbols-outlined text-sm">mail</span>
                            <span className="text-on-surface-variant">{label}:</span> {email}
                        </a>
                    ))}
                </div>
                <p className="mt-4">If you are unsatisfied with our response to a privacy concern and are based in the EU/UK, you have the right to lodge a complaint with your local data protection authority.</p>
            </Section>
        </div>
    );
}
