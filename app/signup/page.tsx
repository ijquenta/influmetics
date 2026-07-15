import Image from "next/image";
import Link from "next/link";

import { SignupForm } from "@/components/signup-form";

export default function SignupPage() {
    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            <div className="flex flex-col gap-4">
                <div className="flex justify-center gap-2 md:justify-start">
                    <Link
                        href="/"
                        className="flex items-center gap-2 rounded-md px-1 py-0.5"
                        aria-label="Influmetics home"
                    >
                        <Image
                            src="/logo-sidebar.png"
                            alt="Influmetics"
                            width={100}
                            height={100}
                            className="size-15"
                        />
                        <span className="font-bold">
                            Influmetics
                        </span>
                    </Link>
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-xs">
                        <SignupForm />
                    </div>
                </div>
            </div>
            <div className="relative hidden lg:block overflow-hidden rounded-2xl">
                <Image
                    src="/login-image-influmetics.png"
                    alt="Cover"
                    fill
                    className="object-cover object-center scale-[1.1] origin-center"
                    priority
                />
            </div>
        </div>
    );
}
