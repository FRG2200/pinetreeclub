import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const { login, register, isLoggingIn, isRegistering, loginError, registerError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [, navigate] = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const isPending = isLoggingIn || isRegistering;
  const error = mode === "login" ? loginError : registerError;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        await register({ email, password, firstName, lastName });
      }
      navigate("/");
    } catch {}
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background" data-testid="auth-page">
      <div className="w-full max-w-sm px-8">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
            AI Creative Studio
          </p>
          <h1 className="text-3xl font-light tracking-tight" data-testid="auth-title">
            Pine tree club
          </h1>
        </div>

        <div className="flex mb-8 border-b border-border">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 pb-3 text-sm tracking-wide transition-colors ${
              mode === "login"
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="tab-login"
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 pb-3 text-sm tracking-wide transition-colors ${
              mode === "register"
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="tab-register"
          >
            新規登録
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === "register" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs uppercase tracking-wider text-muted-foreground">
                  姓
                </Label>
                <Input
                  id="firstName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="田村"
                  required
                  data-testid="input-lastname"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs uppercase tracking-wider text-muted-foreground">
                  名
                </Label>
                <Input
                  id="lastName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="太郎"
                  required
                  data-testid="input-firstname"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">
              メールアドレス
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              data-testid="input-email"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">
              パスワード
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "8文字以上" : "••••••••"}
                required
                minLength={mode === "register" ? 8 : 1}
                className="pr-10"
                data-testid="input-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                data-testid="toggle-password"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive" data-testid="auth-error">
              {error.message}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isPending}
            data-testid="button-submit"
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {mode === "login" ? "ログイン" : "アカウント作成"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-8">
          {mode === "login" ? (
            <>
              アカウントをお持ちでない方は{" "}
              <button
                type="button"
                onClick={() => setMode("register")}
                className="text-primary hover:underline"
                data-testid="link-to-register"
              >
                新規登録
              </button>
            </>
          ) : (
            <>
              既にアカウントをお持ちの方は{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-primary hover:underline"
                data-testid="link-to-login"
              >
                ログイン
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
