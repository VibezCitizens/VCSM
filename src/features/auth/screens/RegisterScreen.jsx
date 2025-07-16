import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Assuming '@/lib/supabaseClient' correctly points to your Supabase client initialization
// This file should export a 'supabase' instance initialized with your Supabase URL and Anon Key.
// Example content for src/lib/supabaseClient.js:
// import { createClient } from '@supabase/supabase-js';
// const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
// const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
// export const supabase = createClient(supabaseUrl, supabaseAnonKey);
import { supabase } from '@/lib/supabaseClient';

const App = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    display_name: '',
    username: '',
    email: '',
    password: '',
    birthdate: '',
    sex: '', // Initialize as empty string for dropdown
    // Removed: interested_in_kids: false,
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handles changes for all input fields, including text and radio buttons
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Determines if the form is valid to enable the register button
  const isFormValid =
    form.display_name !== '' &&
    form.username !== '' &&
    form.email !== '' &&
    form.password !== '' &&
    form.birthdate !== '' &&
    form.sex !== ''; // Ensure sex is selected
    // Removed: (form.interested_in_kids === true || form.interested_in_kids === false);

  // Handles the registration process
  const handleRegister = async () => {
    setLoading(true);
    setErrorMessage(''); // Clear previous errors
    setSuccessMessage(''); // Clear previous success messages

    try {
      // Destructure form data, separating auth credentials from profile data
      // Removed interested_in_kids from profileData destructuring
      const { email, password, ...profileData } = form;

      // Basic validation - this is also covered by isFormValid, but good for a final check
      if (!isFormValid) {
        setErrorMessage('Please fill in all required fields.');
        setLoading(false);
        return;
      }

      // 1. Sign up the user with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        // You can add redirectTo here for email confirmation flow if needed
        // options: {
        //   emailRedirectTo: 'http://localhost:3000/confirm-signup',
        // }
      });

      if (signUpError) {
        throw signUpError;
      }

      // Ensure user data is available after sign-up
      if (!authData || !authData.user) {
        setSuccessMessage('Registration initiated. Please check your email for a confirmation link.');
        setLoading(false);
        return;
      }

      const userId = authData.user.id;

      // Calculate age for is_adult field
      const birthYear = new Date(form.birthdate).getFullYear();
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;
      const isAdult = age >= 18;

      // 2. Insert/Upsert the user's profile into the public.profiles table
      // The 'upsert' method is used here to handle cases where the trigger might
      // have already created a basic profile, or to create it directly.
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        display_name: profileData.display_name,
        username: profileData.username,
        birthdate: profileData.birthdate,
        age: age, // Store calculated age
        sex: profileData.sex,
        is_adult: isAdult, // Store calculated is_adult status
        // Removed: interested_in_kids: profileData.interested_in_kids,
        photo_url: '/default-avatar.png', // Default value, can be updated later
        bio: '', // Default empty bio, can be updated later
        private: false, // Default private status, can be updated later
        created_at: new Date().toISOString(), // Ensure timestamp is correct
        updated_at: new Date().toISOString(), // Ensure timestamp is correct
      });

      if (profileError) {
        throw profileError;
      }

    setSuccessMessage('Registration successful! Redirecting to feed...');
    navigate('/'); // ✅ correct: goes to CentralFeed


    } catch (err) {
      console.error('[Registration Error]', err);
      // Display user-friendly error message
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white px-4 font-inter">
      <div className="bg-zinc-900 p-6 rounded-2xl shadow-2xl w-full max-w-md space-y-4 border border-purple-700">
        <h1 className="text-2xl font-bold text-center mb-6">Join Vibez Citizens</h1>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-200 text-white p-3 rounded-md text-center">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-600 text-white p-3 rounded-md text-center">
            {errorMessage}
          </div>
        )}

        <input
          className="w-full px-4 py-2 rounded-lg bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-zinc-500"
          name="display_name"
          placeholder="Display Name"
          value={form.display_name}
          onChange={handleChange}
          required
        />
        <input
          className="w-full px-4 py-2 rounded-lg bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-zinc-500"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          required
        />
        <input
          className="w-full px-4 py-2 rounded-lg bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-zinc-500"
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          className="w-full px-4 py-2 rounded-lg bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-zinc-500"
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <input
          className="w-full px-4 py-2 rounded-lg bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-zinc-500"
          type="date"
          name="birthdate"
          placeholder="Birthdate"
          value={form.birthdate}
          onChange={handleChange}
          required
        />

        {/* Sex Dropdown Menu */}
        <select
          className="w-full px-4 py-2 rounded-lg bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-zinc-400"
          name="sex"
          value={form.sex}
          onChange={handleChange}
          required
        >
          <option value="">Select Sex</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>

      

        <button
          onClick={handleRegister}
          disabled={loading || !isFormValid}
          className="w-full bg-purple-600 hover:bg-purple-700 transition text-white font-semibold py-3 rounded-xl mt-6 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>

        <p className="text-sm text-center text-zinc-400 mt-4">
          Already have an account?{' '}
          <a href="/login" className="underline text-purple-300 hover:text-purple-400">
            Login here
          </a>
        </p>
      </div>
    </div>
  );
};

export default App;