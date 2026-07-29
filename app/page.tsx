import { LandingNavbar } from "@/components/landing-navbar";
import { DiagnosticWizard } from "@/components/diagnostic-wizard";

export default function Home() {
    return (
        <div className="min-h-svh bg-background">
            <LandingNavbar />
            <main className="pt-20 pb-16">
                <DiagnosticWizard />
            </main>
        </div>
    );
}
