import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const Login = () => {
  const navigate = useNavigate();
  const [currentState, setCurrentState] = useState('Sign Up');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    try {
      if (
        localStorage.getItem('isCustomerLoggedIn') === '1' ||
        Boolean(localStorage.getItem('customerToken'))
      ) {
        navigate('/profile');
      }
    } catch {
      // ignore storage errors
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const onSubmmitHandler = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (currentState === 'Sign Up' && formData.password.trim().length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsSubmitting(true);

    const endpoint = currentState === 'Sign Up' ? '/auth/signup' : '/auth/login';
    const payload =
      currentState === 'Sign Up'
        ? {
            name: formData.name.trim(),
            email: formData.email.trim(),
            password: formData.password,
          }
        : {
            email: formData.email.trim(),
            password: formData.password,
          };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(data.message || 'Authentication failed');
        return;
      }

      const profileData = {
        name: data.user?.name || formData.name.trim() || 'Guest User',
        email: data.user?.email || formData.email.trim(),
        location: data.user?.location || 'Bangalore, India',
        nationality: data.user?.nationality || 'Indian',
        dateOfBirth: data.user?.dateOfBirth || '01 Jan 1998',
      };

      try {
        localStorage.setItem('isCustomerLoggedIn', '1');
        localStorage.setItem('customerToken', data.token || '');
        localStorage.setItem('customerProfile', JSON.stringify(profileData));
      } catch {
        // ignore storage errors
      }

      toast.success(currentState === 'Sign Up' ? 'Account created successfully' : 'Login successful');
      navigate('/profile');
    } catch (error) {
      toast.error(error.message || 'Unable to connect to auth server');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={onSubmmitHandler}
      className="flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800"
    >
      <div className="inline-flex items-center gap-2 mb-2 mt-10">
        <p className="prata-regular text 3x1"> {currentState}</p>
        <hr className="border-none h-[1.5px] w-8 bg-gray-800 " />
      </div>

      <div className="w-full px-3 py-2 flex flex-col gap-4">
        {currentState === 'Sign Up' ? (
          <input
            type="text"
            name="name"
            className="w-Full px-3 py-2 border border-gray-880"
            placeholder="Name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        ) : null}

        <input
          type="email"
          name="email"
          className="w-Full px-3 py-2 border border-gray-880"
          placeholder="Email"
          value={formData.email}
          onChange={handleInputChange}
          required
        />
        <input
          type="password"
          name="password"
          className="w-Full px-3 py-2 border border-gray-880"
          placeholder="Password"
          value={formData.password}
          onChange={handleInputChange}
          required
        />

        <div className="w-full flex justify-between text-sm mt-[-8px]">
          <p className=" cursor-pointer">Forgot your password?</p>
          {currentState === 'Login' ? (
            <p
              onClick={() => setCurrentState('Sign Up')}
              className="cursor-pointer"
            >
              Create Account
            </p>
          ) : (
            <p
              onClick={() => setCurrentState('Login')}
              className="cursor-pointer"
            >
              Login Here
            </p>
          )}
        </div>
        <button className="w-1/2 m-auto bg-black text-white px-8 py-2 mt-4 ">
          {isSubmitting ? 'PLEASE WAIT...' : currentState === 'Login' ? 'Sign In' : 'Sign Up'}
        </button>

        <p className="text-xs text-gray-500 text-center mt-2">
          Demo login: testuser@example.com / testuser123
        </p>
      </div>
    </form>
  );
};

export default Login;
