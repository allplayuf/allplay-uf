import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit2, Eye, EyeOff, Save, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCustomDialog } from "../ui/custom-dialog";

export default function NotificationManagement() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    type: 'feature',
    is_active: true,
    priority: 0
  });

  const { confirm, alert, DialogContainer } = useCustomDialog();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['adminNotifications'],
    queryFn: async () => {
      const notifs = await base44.entities.AdminNotification.list();
      return notifs.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AdminNotification.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AdminNotification.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
      setEditingId(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AdminNotification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      type: 'feature',
      is_active: true,
      priority: 0
    });
    setShowCreateForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title) {
      await alert('Titel krävs', 'Du måste ange en titel för notisen.', { type: 'warning' });
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (notification) => {
    setFormData({
      title: notification.title,
      subtitle: notification.subtitle || '',
      type: notification.type,
      is_active: notification.is_active,
      priority: notification.priority || 0
    });
    setEditingId(notification.id);
    setShowCreateForm(true);
  };

  const handleToggleActive = async (notification) => {
    updateMutation.mutate({
      id: notification.id,
      data: { ...notification, is_active: !notification.is_active }
    });
  };

  const handleDelete = async (id) => {
    const shouldDelete = await confirm(
      'Radera notis',
      'Är du säker på att du vill radera denna notis?',
      { type: 'warning', confirmText: 'Ja, radera', cancelText: 'Avbryt' }
    );

    if (shouldDelete) {
      deleteMutation.mutate(id);
    }
  };

  const typeLabels = {
    venue: 'Plan',
    feature: 'Funktion',
    social: 'Social',
    match: 'Match',
    reminder: 'Påminnelse',
    achievement: 'Prestation'
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-[#2BA84A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DialogContainer />

      <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[20px]">
        <CardHeader className="border-b border-[#223029] pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[#F4F7F5] text-xl">Hantera Dashboard-notiser</CardTitle>
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-[#2BA84A] hover:bg-[#248232] text-white rounded-xl h-10 px-4 gap-2"
            >
              <Plus className="w-4 h-4" />
              Ny notis
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Create/Edit Form */}
          <AnimatePresence>
            {showCreateForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <form onSubmit={handleSubmit} className="bg-[#18221E] rounded-xl p-4 space-y-4 border border-[#223029]">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[#F4F7F5] font-semibold">
                      {editingId ? 'Redigera notis' : 'Skapa ny notis'}
                    </h3>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-[#B6C2BC] hover:text-[#F4F7F5]"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#B6C2BC] mb-2">Titel *</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="T.ex. Nya funktioner i appen"
                      className="bg-[#121715] border-[#223029] text-[#F4F7F5]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#B6C2BC] mb-2">Undertext</label>
                    <Input
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      placeholder="T.ex. Kolla in turneringar!"
                      className="bg-[#121715] border-[#223029] text-[#F4F7F5]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#B6C2BC] mb-2">Typ</label>
                      <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                        <SelectTrigger className="bg-[#121715] border-[#223029] text-[#F4F7F5]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#121715] border-[#223029]">
                          {Object.entries(typeLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#B6C2BC] mb-2">Prioritet</label>
                      <Input
                        type="number"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                        className="bg-[#121715] border-[#223029] text-[#F4F7F5]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 rounded bg-[#121715] border-[#223029]"
                    />
                    <label htmlFor="is_active" className="text-sm text-[#B6C2BC]">Aktiv (visas på dashboard)</label>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="submit" className="bg-[#2BA84A] hover:bg-[#248232] text-white rounded-xl flex-1">
                      <Save className="w-4 h-4 mr-2" />
                      {editingId ? 'Uppdatera' : 'Skapa'}
                    </Button>
                    <Button type="button" onClick={resetForm} className="bg-[#18221E] hover:bg-[#223029] text-[#F4F7F5] rounded-xl px-6">
                      Avbryt
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#B6C2BC]">Inga notiser skapade än</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-[#18221E] rounded-xl p-4 border transition-all ${
                    notification.is_active ? 'border-[#2BA84A]/30' : 'border-[#223029] opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-[#F4F7F5] font-semibold">{notification.title}</h4>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#2BA84A]/20 text-[#2BA84A]">
                          {typeLabels[notification.type]}
                        </span>
                        {notification.priority > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#F4743B]/20 text-[#F4743B]">
                            Prio: {notification.priority}
                          </span>
                        )}
                      </div>
                      {notification.subtitle && (
                        <p className="text-sm text-[#B6C2BC]">{notification.subtitle}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleToggleActive(notification)}
                        className="p-2 rounded-lg bg-[#121715] hover:bg-[#223029] text-[#B6C2BC] hover:text-[#F4F7F5] transition-colors"
                        title={notification.is_active ? 'Dölj' : 'Visa'}
                      >
                        {notification.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleEdit(notification)}
                        className="p-2 rounded-lg bg-[#121715] hover:bg-[#223029] text-[#B6C2BC] hover:text-[#2BA84A] transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="p-2 rounded-lg bg-[#121715] hover:bg-[#223029] text-[#B6C2BC] hover:text-[#F4743B] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}