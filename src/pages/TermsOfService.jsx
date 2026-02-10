import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

// Redirect old ToS page to new LegalPolicy page
export default function TermsOfServicePage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate(createPageUrl("LegalPolicy"), { replace: true });
  }, [navigate]);

  return null;
}