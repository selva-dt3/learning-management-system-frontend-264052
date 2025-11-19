import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * PUBLIC_INTERFACE
 * Signup - disabled. This component immediately redirects to /auth/login preserving any role query param if present.
 */
export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const search = location.search || '';
    navigate(`/auth/login${search}`, { replace: true });
  }, [navigate, location.search]);

  return null;
}
