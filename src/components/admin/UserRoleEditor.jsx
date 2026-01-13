import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Shield, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from "@/api/base44Client";

const CUSTOM_ROLES = [
  { value: 'CUP_ADMIN', label: 'Cup Administrator', description: 'Kan hantera alla cuper och turneringar' },
  { value: 'MODERATOR', label: 'Moderator', description: 'Kan hantera rapporter och moderera innehåll' },
  { value: 'VENUE_MANAGER', label: 'Planansvarig', description: 'Kan lägga till och verifiera planer' }
];

export default function UserRoleEditor({ user, isOpen, onClose, onSuccess }) {
  const [selectedRole, setSelectedRole] = useState(user?.role || 'user');
  const [selectedCustomRoles, setSelectedCustomRoles] = useState(user?.custom_roles || []);
  const [isSaving, setIsSaving] = useState(false);

  const toggleCustomRole = (roleValue) => {
    setSelectedCustomRoles(prev => 
      prev.includes(roleValue)
        ? prev.filter(r => r !== roleValue)
        : [...prev, roleValue]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: response } = await base44.functions.invoke('updateUserRole', {
        targetUserId: user.id,
        role: selectedRole,
        customRoles: selectedCustomRoles
      });

      if (response?.success) {
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Kunde inte uppdatera roll. Försök igen.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#121715] rounded-2xl border border-[#223029] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#223029]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2BA84A]/10 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#2BA84A]" />
            </div>
            <div>
              <h2 className="font-semibold text-[#F4F7F5]">Redigera roller</h2>
              <p className="text-xs text-[#7B8A83]">{user?.display_name || user?.full_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#18221E] flex items-center justify-center text-[#7B8A83] hover:text-[#F4F7F5] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Base Role */}
          <div>
            <Label className="text-[#F4F7F5] font-semibold mb-3 block">Grundroll</Label>
            <div className="space-y-2">
              {['user', 'admin'].map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                    selectedRole === role
                      ? 'bg-[#2BA84A]/20 border-[#2BA84A] text-[#2BA84A]'
                      : 'bg-[#18221E] border-[#223029] text-[#B6C2BC] hover:border-[#2BA84A]/50'
                  }`}
                >
                  <span className="font-medium capitalize">{role === 'admin' ? 'Admin (Full åtkomst)' : 'Användare'}</span>
                  {selectedRole === role && <div className="w-2 h-2 bg-[#2BA84A] rounded-full" />}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Roles */}
          <div>
            <Label className="text-[#F4F7F5] font-semibold mb-3 block">Extra roller</Label>
            <div className="space-y-3">
              {CUSTOM_ROLES.map((role) => (
                <div
                  key={role.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                    selectedCustomRoles.includes(role.value)
                      ? 'bg-[#F59E0B]/10 border-[#F59E0B]/30'
                      : 'bg-[#18221E] border-[#223029]'
                  }`}
                >
                  <Checkbox
                    checked={selectedCustomRoles.includes(role.value)}
                    onCheckedChange={() => toggleCustomRole(role.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-[#F4F7F5] text-sm">{role.label}</p>
                    <p className="text-xs text-[#7B8A83] mt-0.5">{role.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-[#2BA84A] hover:bg-[#248232] text-white rounded-xl h-11 gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sparar...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Spara ändringar
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}