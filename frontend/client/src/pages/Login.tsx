import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  TrendingUp,
  Users,
  Calendar,
  CheckCircle2,
  Chrome,
  Apple,
  LogIn,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');

  // Animated background particles
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 4,
  }));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      toast({
        title: '⚠️ Missing Information',
        description: 'Please enter both email and password',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // Check if user exists
      const users = JSON.parse(localStorage.getItem('zervos_users') || '[]');
      const user = users.find((u: any) => u.email === loginForm.email && u.password === loginForm.password);

      if (user) {
        localStorage.setItem('zervos_current_user', JSON.stringify(user));
        localStorage.setItem('zervos_is_authenticated', 'true');
        
        toast({
          title: '✅ Login Successful!',
          description: `Welcome back, ${user.name}!`,
        });

        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      } else {
        toast({
          title: '❌ Login Failed',
          description: 'Invalid email or password',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    }, 1500);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupForm.name || !signupForm.email || !signupForm.password || !signupForm.confirmPassword) {
      toast({
        title: '⚠️ Missing Information',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      toast({
        title: '⚠️ Password Mismatch',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (signupForm.password.length < 6) {
      toast({
        title: '⚠️ Weak Password',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('zervos_users') || '[]');
      
      // Check if user already exists
      if (users.find((u: any) => u.email === signupForm.email)) {
        toast({
          title: '⚠️ Account Exists',
          description: 'An account with this email already exists',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const newUser = {
        id: Date.now().toString(),
        name: signupForm.name,
        email: signupForm.email,
        password: signupForm.password,
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      localStorage.setItem('zervos_users', JSON.stringify(users));
      localStorage.setItem('zervos_current_user', JSON.stringify(newUser));
      localStorage.setItem('zervos_is_authenticated', 'true');

      toast({
        title: '✅ Account Created!',
        description: 'Your account has been created successfully',
      });

      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    }, 1500);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail) {
      toast({
        title: '⚠️ Missing Email',
        description: 'Please enter your email address',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      toast({
        title: '✅ Email Sent!',
        description: 'Password reset link has been sent to your email',
      });
      setIsLoading(false);
      setShowForgotPassword(false);
      setForgotPasswordEmail('');
    }, 1500);
  };

  const handleSocialLogin = (provider: string) => {
    toast({
      title: `${provider} Login`,
      description: 'Social login coming soon!',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-2 h-2 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-30"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Floating gradient orbs */}
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -30, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"
        animate={{
          scale: [1, 1.4, 1],
          x: [-100, 50, -100],
          y: [-50, 100, -50],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Main Content */}
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Side - Branding & Features */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden md:block space-y-8"
        >
          {/* Logo & Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl"
                animate={{
                  rotate: [0, 5, 0, -5, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <Sparkles className="h-8 w-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Zervos
                </h1>
                <p className="text-slate-600 text-sm">Your Business, Simplified</p>
              </div>
            </div>
          </motion.div>

          {/* Feature Cards */}
          <div className="space-y-4">
            {[
              {
                icon: Shield,
                title: 'Secure & Reliable',
                description: 'Bank-level security for your business data',
                color: 'from-blue-500 to-cyan-500',
              },
              {
                icon: TrendingUp,
                title: 'Boost Your Sales',
                description: 'Advanced analytics and insights',
                color: 'from-green-500 to-emerald-500',
              },
              {
                icon: Users,
                title: 'Team Collaboration',
                description: 'Manage your team effortlessly',
                color: 'from-purple-500 to-pink-500',
              },
              {
                icon: Calendar,
                title: 'Smart Scheduling',
                description: 'Never miss an appointment',
                color: 'from-amber-500 to-orange-500',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.05, x: 10 }}
                className="flex items-start gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-slate-600">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-3 gap-4"
          >
            {[
              { label: 'Active Users', value: '10K+' },
              { label: 'Businesses', value: '500+' },
              { label: 'Uptime', value: '99.9%' },
            ].map((stat, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-white/50">
                <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-xs text-slate-600 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right Side - Auth Forms */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full"
        >
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 md:p-10">
            <AnimatePresence mode="wait">
              {!showForgotPassword ? (
                <motion.div
                  key="auth"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Tabs */}
                  <div className="flex gap-2 mb-8 bg-slate-100 rounded-2xl p-1">
                    <button
                      onClick={() => setIsLogin(true)}
                      className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 ${
                        isLogin
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <LogIn className="inline h-4 w-4 mr-2" />
                      Login
                    </button>
                    <button
                      onClick={() => setIsLogin(false)}
                      className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 ${
                        !isLogin
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Sparkles className="inline h-4 w-4 mr-2" />
                      Sign Up
                    </button>
                  </div>

                  {/* Login Form */}
                  {isLogin ? (
                    <motion.form
                      key="login"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      onSubmit={handleLogin}
                      className="space-y-6"
                    >
                      <div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back!</h2>
                        <p className="text-slate-600">Login to continue to your dashboard</p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="login-email" className="text-slate-700 font-medium">
                            Email Address
                          </Label>
                          <div className="relative mt-2">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                              id="login-email"
                              type="email"
                              placeholder="you@example.com"
                              value={loginForm.email}
                              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                              className="pl-12 h-12 rounded-xl border-2 border-slate-200 focus:border-purple-500 transition-all"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="login-password" className="text-slate-700 font-medium">
                            Password
                          </Label>
                          <div className="relative mt-2">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                              id="login-password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              value={loginForm.password}
                              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                              className="pl-12 pr-12 h-12 rounded-xl border-2 border-slate-200 focus:border-purple-500 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                          <input type="checkbox" className="rounded border-slate-300" />
                          Remember me
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-purple-600 hover:text-purple-700 font-medium transition-colors"
                        >
                          Forgot Password?
                        </button>
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-base"
                      >
                        {isLoading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          />
                        ) : (
                          <>
                            Login to Dashboard
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </Button>

                      {/* Social Login */}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-4 bg-white text-slate-500">Or continue with</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleSocialLogin('Google')}
                          className="h-12 rounded-xl border-2 hover:bg-slate-50 transition-all"
                        >
                          <Chrome className="h-5 w-5 mr-2" />
                          Google
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleSocialLogin('Apple')}
                          className="h-12 rounded-xl border-2 hover:bg-slate-50 transition-all"
                        >
                          <Apple className="h-5 w-5 mr-2" />
                          Apple
                        </Button>
                      </div>
                    </motion.form>
                  ) : (
                    /* Sign Up Form */
                    <motion.form
                      key="signup"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      onSubmit={handleSignup}
                      className="space-y-6"
                    >
                      <div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h2>
                        <p className="text-slate-600">Get started with your free account</p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="signup-name" className="text-slate-700 font-medium">
                            Full Name
                          </Label>
                          <div className="relative mt-2">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                              id="signup-name"
                              type="text"
                              placeholder="John Doe"
                              value={signupForm.name}
                              onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                              className="pl-12 h-12 rounded-xl border-2 border-slate-200 focus:border-purple-500 transition-all"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="signup-email" className="text-slate-700 font-medium">
                            Email Address
                          </Label>
                          <div className="relative mt-2">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                              id="signup-email"
                              type="email"
                              placeholder="you@example.com"
                              value={signupForm.email}
                              onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                              className="pl-12 h-12 rounded-xl border-2 border-slate-200 focus:border-purple-500 transition-all"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="signup-password" className="text-slate-700 font-medium">
                            Password
                          </Label>
                          <div className="relative mt-2">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                              id="signup-password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              value={signupForm.password}
                              onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                              className="pl-12 pr-12 h-12 rounded-xl border-2 border-slate-200 focus:border-purple-500 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="signup-confirm-password" className="text-slate-700 font-medium">
                            Confirm Password
                          </Label>
                          <div className="relative mt-2">
                            <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                              id="signup-confirm-password"
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              value={signupForm.confirmPassword}
                              onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                              className="pl-12 pr-12 h-12 rounded-xl border-2 border-slate-200 focus:border-purple-500 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="text-sm">
                        <label className="flex items-start gap-2 text-slate-600 cursor-pointer">
                          <input type="checkbox" className="mt-1 rounded border-slate-300" required />
                          <span>
                            I agree to the{' '}
                            <a href="#" className="text-purple-600 hover:text-purple-700 font-medium">
                              Terms of Service
                            </a>{' '}
                            and{' '}
                            <a href="#" className="text-purple-600 hover:text-purple-700 font-medium">
                              Privacy Policy
                            </a>
                          </span>
                        </label>
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-base"
                      >
                        {isLoading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          />
                        ) : (
                          <>
                            Create My Account
                            <Sparkles className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </Button>

                      {/* Social Signup */}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-4 bg-white text-slate-500">Or sign up with</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleSocialLogin('Google')}
                          className="h-12 rounded-xl border-2 hover:bg-slate-50 transition-all"
                        >
                          <Chrome className="h-5 w-5 mr-2" />
                          Google
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleSocialLogin('Apple')}
                          className="h-12 rounded-xl border-2 hover:bg-slate-50 transition-all"
                        >
                          <Apple className="h-5 w-5 mr-2" />
                          Apple
                        </Button>
                      </div>
                    </motion.form>
                  )}
                </motion.div>
              ) : (
                /* Forgot Password Form */
                <motion.form
                  key="forgot"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleForgotPassword}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring' }}
                      className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                      <Lock className="h-10 w-10 text-purple-600" />
                    </motion.div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Forgot Password?</h2>
                    <p className="text-slate-600">
                      No worries! Enter your email and we'll send you reset instructions.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="forgot-email" className="text-slate-700 font-medium">
                      Email Address
                    </Label>
                    <div className="relative mt-2">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="you@example.com"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        className="pl-12 h-12 rounded-xl border-2 border-slate-200 focus:border-purple-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-base"
                    >
                      {isLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : (
                        <>
                          Send Reset Link
                          <Zap className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForgotPassword(false)}
                      className="w-full h-12 rounded-xl border-2 hover:bg-slate-50 transition-all"
                    >
                      Back to Login
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center text-sm text-slate-600 mt-6"
          >
            Protected by industry-leading security standards
          </motion.p>
        </motion.div>
      </div>

      {/* Mobile Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="md:hidden absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Zervos
        </span>
      </motion.div>
    </div>
  );
}
