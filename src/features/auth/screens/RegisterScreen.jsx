import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export default function RegisterScreen() {
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [sex, setSex] = useState('');
  const [interestedInKids, setInterestedInKids] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculateAge = (dob) => {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const isUsernameValid = (username) => {
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const age = calculateAge(birthdate);

    if (age < 13) {
      alert('You must be at least 13 years old to use this platform.');
      return;
    }

    if (!sex) {
      alert('Please select your sex.');
      return;
    }

    if (interestedInKids === null) {
      alert('Please indicate if you’re interested in Vibez Kids.');
      return;
    }

    if (!isUsernameValid(username)) {
      alert('Username must be 3-20 characters long and only include letters, numbers, and underscores.');
      return;
    }

    setLoading(true);
    try {
      const { data: existing, error: usernameError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (existing) {
        alert('Username already taken. Please choose another.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            username,
            birthdate,
            age,
            sex,
            is_adult: age >= 18,
            interested_in_kids: interestedInKids,
            photo_url: '/default-avatar.png',
            bio: '',
            private: false,
          },
        },
      });

      if (error) throw error;

      const userId = data?.user?.id;
      if (!userId) throw new Error('User not returned after signup.');

      navigate(`/u/${username}`);
    } catch (err) {
      console.error('[Register] Error:', err);
      alert(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900 px-4">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-sm space-y-4 p-6 bg-neutral-800 rounded-lg shadow-md"
      >
        <h1 className="text-xl font-semibold text-center text-white">Create an Account</h1>

        <input
          type="text"
          placeholder="Display Name"
          className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded text-white"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Username"
          className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded text-white"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded text-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded text-white"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <label className="text-sm text-neutral-400">Birthdate</label>
        <input
          type="date"
          className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded text-white"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          required
        />

        <label className="text-sm text-neutral-400">Sex</label>
        <select
          className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded text-white"
          value={sex}
          onChange={(e) => setSex(e.target.value)}
          required
        >
          <option value="">Select</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="other">Other</option>
        </select>

        <fieldset className="text-white">
          <legend className="text-sm text-neutral-400 mb-1">Interested in Vibez Kids?</legend>
          <label className="mr-4">
            <input
              type="radio"
              name="interestedInKids"
              value="yes"
              checked={interestedInKids === true}
              onChange={() => setInterestedInKids(true)}
            />{' '}
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="interestedInKids"
              value="no"
              checked={interestedInKids === false}
              onChange={() => setInterestedInKids(false)}
            />{' '}
            No
          </label>
        </fieldset>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-500 disabled:opacity-50"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>

        <p className="text-center text-sm text-neutral-400">
          Already have an account?{' '}
          <Link to="/login" className="text-purple-400 hover:underline">
            Login here
          </Link>
        </p>
      </form>
    </div>
  );
}
