import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="card mx-auto mt-10 max-w-md p-8 text-center">
      <ShieldAlert className="mx-auto size-10 text-amber-500" aria-hidden />
      <h1 className="mt-4 text-xl font-extrabold text-slate-900">Недостатньо прав</h1>
      <p className="mt-2 text-sm text-slate-600">
        Ваша роль не має доступу до цього розділу. Зверніться до головного адміністратора.
      </p>
      <Link href="/admin" className="btn btn-primary mt-6">
        До огляду
      </Link>
    </div>
  );
}
