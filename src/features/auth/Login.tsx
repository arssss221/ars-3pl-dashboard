import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../services/firebase/config';
import {
  Package,
  Lock,
  Mail,
  ArrowRight,
  Phone,
  Building2,
  Sparkles,
  CheckCircle,
  Eye,
  EyeOff,
  Shield,
  Zap,
} from 'lucide-react';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: '',
    phone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;
      const companyId = `comp_${user.uid.substring(0, 8)}`;

      await setDoc(doc(db, 'companies', companyId), {
        name: formData.companyName,
        phone: formData.phone,
        ownerId: user.uid,
        maxUsers: 5,
        currentUsers: 1,
        createdAt: serverTimestamp(),
      });

      const ownerData = {
        email: formData.email,
        companyId: companyId,
        role: 'owner',
        status: 'pending',
        permissions: {
          dashboard: true,
          employees: true,
          vehicles: true,
          profile: true,
          settings: true,
        },
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', user.uid), ownerData);
      setSuccess('✅ Registration successful! Waiting for admin approval.');
      setIsRegistering(false);
      await auth.signOut();
    } catch (err: any) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists())
        throw new Error('User profile not found! Please contact admin.');

      const userData = userDoc.data();
      if (userData.status === 'pending') {
        await auth.signOut();
        throw new Error(
          '⏳ Your account is pending approval. Please wait for admin activation.'
        );
      }

      localStorage.setItem(
        'userSession',
        JSON.stringify({ uid: user.uid, ...userData })
      );
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return 0;
    let strength = 0;
    if (pwd.length >= 6) strength += 1;
    if (pwd.length >= 8) strength += 1;
    if (/[A-Z]/.test(pwd)) strength += 1;
    if (/[0-9]/.test(pwd)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) strength += 1;
    return Math.min(strength, 4);
  };
  const passwordStrength = getPasswordStrength(formData.password);
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-100 p-3">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-[380px] relative z-10">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 overflow-hidden transition-all duration-300 hover:shadow-emerald-100/30">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5 text-center relative">
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <div className="relative">
              <div className="flex justify-center mb-2">
                <div className="p-2 bg-emerald-500/15 rounded-full backdrop-blur-sm shadow-sm">
                  <Package size={28} className="text-emerald-400" />
                </div>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                ARS Logistics Manager
              </h1>
              <p className="text-emerald-400/80 text-[11px] font-semibold uppercase tracking-wider mt-0.5">
                Dashboard
              </p>
              <p className="text-slate-400 text-[10px] mt-1.5">
                Smart Logistics Management Platform
              </p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {error && (
              <div className="p-2.5 bg-red-50/90 text-red-600 text-xs font-medium rounded-lg border border-red-100 animate-shake">
                {error}
              </div>
            )}
            {success && (
              <div className="p-2.5 bg-emerald-50/90 text-emerald-700 text-xs font-medium rounded-lg border border-emerald-100 flex items-center gap-1.5">
                <CheckCircle size={14} />
                {success}
              </div>
            )}

            <form
              onSubmit={isRegistering ? handleRegister : handleLogin}
              className="space-y-3"
            >
              {isRegistering && (
                <>
                  <div className="group relative">
                    <Building2
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors"
                      size={16}
                    />
                    <input
                      name="companyName"
                      onChange={handleChange}
                      required
                      placeholder="Company name"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                    />
                  </div>
                  <div className="group relative">
                    <Phone
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors"
                      size={16}
                    />
                    <input
                      type="tel"
                      name="phone"
                      onChange={handleChange}
                      required
                      placeholder="WhatsApp number"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                    />
                  </div>
                </>
              )}

              <div className="group relative">
                <Mail
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors"
                  size={16}
                />
                <input
                  type="email"
                  name="email"
                  onChange={handleChange}
                  required
                  placeholder="Email address"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                />
              </div>

              <div className="group relative">
                <Lock
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors"
                  size={16}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="Password (min. 6 chars)"
                  className="w-full pl-8 pr-8 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {isRegistering && formData.password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          i < passwordStrength
                            ? passwordStrength === 1
                              ? 'bg-red-500'
                              : passwordStrength === 2
                              ? 'bg-yellow-500'
                              : passwordStrength === 3
                              ? 'bg-blue-500'
                              : 'bg-emerald-500'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 flex justify-between">
                    <span>
                      Strength: {strengthLabels[passwordStrength - 1] || 'None'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Shield size={10} />
                      Secure login
                    </span>
                  </p>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <Zap size={12} className="text-emerald-500" />
                <span>
                  {isRegistering
                    ? 'Admin approval required after registration'
                    : 'Secure access with role-based permissions'}
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-70 shadow-md"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isRegistering ? (
                  <>
                    Create Company <Sparkles size={14} />
                  </>
                ) : (
                  <>
                    Secure Login <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError('');
                  setSuccess('');
                  setShowPassword(false);
                }}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors hover:underline"
              >
                {isRegistering ? '← Back to login' : 'Register new company →'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.25s ease-in-out; }
      `}</style>
    </div>
  );
}
