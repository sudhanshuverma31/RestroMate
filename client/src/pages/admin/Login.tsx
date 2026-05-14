import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Lock, Mail, User as UserIcon, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if any users exist to determine if registration is open
    const checkUsers = async () => {
      try {
        await api.get('/admin/health'); // Using health check to get some info or just try a public route
        // Assuming backend handles the registration check
      } catch (err) {}
    };
    checkUsers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/admin/login' : '/admin/register';
      const res = await api.post(endpoint, formData);
      
      login(res.data.token, res.data.user);
      toast.success(res.data.message || 'Success!');
      navigate('/admin/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 dark:bg-dark-bg bg-light-bg overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-600/30 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-800/20 blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 shadow-gold mb-6 rotate-3">
            <UtensilsCrossed size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold font-display dark:text-brand-500 text-brand-700 mb-2">RestroMate</h1>
          <p className="dark:text-brand-700 text-brand-600 font-medium">Restaurant Management System</p>
        </div>

        <div className="card p-8 border-t-4 border-t-brand-600">
          <div className="flex mb-8 bg-dark-muted/50 p-1 rounded-xl">
            <button 
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-brand-600 text-white shadow-md' : 'text-brand-700'}`}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button 
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-brand-600 text-white shadow-md' : 'text-brand-700'}`}
              onClick={() => setIsLogin(false)}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="animate-slide-up">
                <label className="label" htmlFor="name">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-700" size={18} />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="input pl-10"
                    placeholder="John Doe"
                    required={!isLogin}
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="label" htmlFor="email">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-700" size={18} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="input pl-10"
                  placeholder="admin@restromate.com"
                  required
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-700" size={18} />
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="input pl-10"
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-4 text-base mt-4 group"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {isLogin ? 'Sign In to Dashboard' : 'Register Admin Account'}
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {!isLogin && (
            <p className="mt-6 text-xs text-center dark:text-brand-700 text-brand-600 leading-relaxed">
              Note: Only the first user can register as a Super Admin. Subsequent admins must be created by an existing admin.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
