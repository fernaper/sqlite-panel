import { useState } from 'react';
import { toast } from 'sonner';
import Card from '@/components/ui/Card.tsx';
import TextInput from '@/components/ui/TextInput.tsx';
import Button from '@/components/ui/Button.tsx';
import Logo from '@/components/ui/Logo.tsx';
import Loader from '@/components/ui/Loader.tsx';
import { LockClosedIcon, UserIcon } from '@heroicons/react/24/solid';

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const params = new URLSearchParams();
    // Manually append form data to URLSearchParams
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') {
        params.append(key, value);
      }
    }


    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          // Content-Type will be automatically set to 'application/x-www-form-urlencoded'
          // when the body is URLSearchParams
        },
        body: params, // Send URLSearchParams instead of FormData
      });

      // Log response headers
      console.log('Response headers:');
      for (const [key, value] of response.headers.entries()) {
        console.log(`${key}: ${value}`);
      }

      const result = await response.json();
      console.log('result', result)

      if (response.ok && result.success && result.token) {
        console.log('Login successful, storing token and redirecting...');
        localStorage.setItem('sqlite-panel-jwt', result.token); // Store the JWT
        window.location.href = '/admin'; // Redirect on success
      } else {
        console.error('Login failed:', result.message);
        // Use toast for error notification
        toast.error(result.message || 'Invalid credentials or server error.');
        setError(result.message || 'Invalid credentials or server error.'); // Still set error for display below form
      }
    } catch (err) {
      console.error('Error submitting login form:', err);
      // Use toast for error notification
      toast.error('An error occurred during login. Please try again.');
      setError('An error occurred during login. Please try again.'); // Still set error for display below form
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md py-10 px-9">
      <div className="flex justify-center mb-6">
        <Logo className="h-12 w-auto" />
      </div>
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">Login to SQLite Panel</h2>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col space-y-3">
          <TextInput
            name="username"
            icon={<UserIcon className="w-6 h-6" />}
            iconPosition="left"
            className="w-full"
            label="Username"
            placeholder="Enter your username"
            required
            disabled={isLoading}
          />
          <TextInput
            name="password"
            inputType="password"
            icon={<LockClosedIcon className="w-6 h-6" />}
            iconPosition="left"
            className="w-full"
            label="Password"
            required
            disabled={isLoading}
          />
          <TextInput
            label="SQLite File Path"
            id="dbPath"
            name="dbPath"
            className="w-full min-w-full"
            placeholder="Path to SQLite file"
            defaultValue="/sqlite/data.db" // Use defaultValue for React controlled/uncontrolled inputs
            required
            disabled={isLoading}
          />
        </div>
        <Button type="submit" className="w-full mt-6" disabled={isLoading}>
          {isLoading ? <Loader className="w-5 h-5 mx-auto" /> : 'Login'}
        </Button>
      </form>
    </Card>
  );
}