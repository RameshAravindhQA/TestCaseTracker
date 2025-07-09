
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TestSheets() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard since test sheets module is removed
    navigate('/dashboard');
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Test Sheets Module Removed
        </h2>
        <p className="text-gray-600 mb-4">
          This module has been removed. Redirecting to dashboard...
        </p>
      </div>
    </div>
  );
}
