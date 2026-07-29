import Link from "next/link";
import Image from "next/image";

export function LandingNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 bg-background/80 backdrop-blur-md border-b border-border/50">
      <Link href="/" className="flex items-center gap-3">
        <Image
          src="/logo-sidebar.png"
          alt="Influmetics"
          width={44}
          height={44}
          className="size-11"
        />
        <span className="font-bold text-xl tracking-tight">Influmetics</span>
      </Link>
      <Link
        href="/login"
        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-full hover:bg-muted"
      >
        Iniciar sesión
      </Link>
    </nav>
  );
}
