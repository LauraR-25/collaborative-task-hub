import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { profileService, type DeviceSession, type Profile as ProfileModel } from '@/services/profileService';
import { useAuth } from '@/context/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();

  const isMock = import.meta.env.MODE === 'mock' || import.meta.env.VITE_MOCK_API === 'true';

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileModel | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; bio?: string; phone?: string }>({});

  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(user?.name || '');
  const [draftEmail, setDraftEmail] = useState(user?.email || '');
  const [draftBio, setDraftBio] = useState('');
  const [draftPhone, setDraftPhone] = useState('');

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNext, setPwNext] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwVisible, setPwVisible] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [passwordSupported, setPasswordSupported] = useState<boolean>(isMock);

  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const [sessionsSupported, setSessionsSupported] = useState<boolean | null>(isMock ? null : false);
  const [deleteSupported, setDeleteSupported] = useState<boolean>(isMock);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setFieldErrors({});
      try {
        const p = await profileService.getProfile();
        setProfile(p);
        setDraftName(p.name);
        setDraftEmail(p.email);
        setDraftBio(p.bio || '');
        setDraftPhone(p.phone || '');
        updateUser({ name: p.name, email: p.email });

        try {
          const sess = await profileService.listSessions();
          setSessions(sess);
          setSessionsSupported(true);
        } catch (e: any) {
          if (e?.code === 'FEATURE_UNAVAILABLE') {
            setSessionsSupported(false);
          } else {
            setSessionsSupported(false);
          }
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || 'No se pudo cargar el perfil');
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatMemberSince = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const timeAgo = (iso: string) => {
    const d = new Date(iso);
    const ms = Date.now() - d.getTime();
    if (Number.isNaN(ms)) return '—';
    const minutes = Math.max(0, Math.floor(ms / 60000));
    if (minutes < 1) return 'hace unos segundos';
    if (minutes === 1) return 'hace 1 minuto';
    if (minutes < 60) return `hace ${minutes} minutos`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return 'hace 1 hora';
    if (hours < 24) return `hace ${hours} horas`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'hace 1 día';
    return `hace ${days} días`;
  };

  const validateProfile = () => {
    const nextErrors: { name?: string; email?: string; bio?: string; phone?: string } = {};

    const name = draftName.trim();
    const email = draftEmail.trim();

    if (!name) nextErrors.name = 'El nombre es requerido';
    else if (name.length < 1 || name.length > 250) nextErrors.name = 'El nombre debe tener entre 1 y 250 caracteres';

    if (!email) nextErrors.email = 'El email es requerido';
    else if (email.length > 250) nextErrors.email = 'El email no puede superar 250 caracteres';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Email inválido';

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const mapHttpError = (e: any) => {
    const status: number | undefined = e?.response?.status;
    if (status === 400) return e?.response?.data?.message || 'Revisa los campos e intenta de nuevo';
    if (status === 401) return 'Sesión expirada. Vuelve a iniciar sesión.';
    if (status === 403) return 'No tienes permisos para realizar esta acción.';
    if (status === 404) return 'Recurso no encontrado.';
    if (status === 409) return 'El correo ya está registrado.';
    if (status === 429) return 'Demasiadas solicitudes. Intenta más tarde.';
    if (status && status >= 500) return 'Error inesperado. Intenta más tarde.';
    return e?.response?.data?.message || e?.message || 'Ocurrió un error.';
  };

  const handleSaveProfile = async () => {
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    if (!validateProfile()) return;

    try {
      const updated = await profileService.updateProfile({
        name: draftName.trim(),
        email: draftEmail.trim(),
        bio: draftBio.trim(),
        phone: draftPhone.trim(),
      });
      setProfile(updated);
      updateUser({ name: updated.name, email: updated.email });
      setEditing(false);
      setSuccess('Perfil actualizado');
    } catch (e: any) {
      const status = e?.response?.status;
      const apiErrors = e?.response?.data?.errors;
      if (status === 400 && apiErrors && typeof apiErrors === 'object') {
        setFieldErrors({
          ...(apiErrors.name ? { name: String(apiErrors.name) } : {}),
          ...(apiErrors.email ? { email: String(apiErrors.email) } : {}),
          ...(apiErrors.bio ? { bio: String(apiErrors.bio) } : {}),
          ...(apiErrors.phone ? { phone: String(apiErrors.phone) } : {}),
        });
      } else {
        const msg = mapHttpError(e);
        if (status === 409) setFieldErrors({ email: msg });
        else setError(msg);
      }

      if (status === 401) {
        await logout();
        navigate('/login');
      }
    }
  };

  const handleChangePassword = async () => {
    setError(null);
    setSuccess(null);

    if (passwordSupported === false) {
      setError('Próximamente');
      return;
    }

    if (!pwCurrent || !pwNext || !pwConfirm) {
      setError('Completa los 3 campos de contraseña');
      return;
    }

    if (pwNext.length < 8 || pwNext.length > 15) {
      setError('La nueva contraseña debe tener entre 8 y 15 caracteres');
      return;
    }

    if (pwNext !== pwConfirm) {
      setError('La nueva contraseña y la confirmación no coinciden');
      return;
    }

    setPwSaving(true);
    try {
      await profileService.changePassword({ current_password: pwCurrent, new_password: pwNext });
      setPasswordSupported(true);
      setPwCurrent('');
      setPwNext('');
      setPwConfirm('');
      setSuccess('Contraseña cambiada');
    } catch (e: any) {
      if (e?.code === 'FEATURE_UNAVAILABLE') {
        setPasswordSupported(false);
        setError('Próximamente');
      } else {
        setError(mapHttpError(e));
      }
    } finally {
      setPwSaving(false);
    }
  };

  const reloadSessions = async () => {
    setSessionsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const sess = await profileService.listSessions();
      setSessions(sess);
      setSessionsSupported(true);
    } catch (e: any) {
      if (e?.code === 'FEATURE_UNAVAILABLE') {
        setSessionsSupported(false);
      } else {
        setError(mapHttpError(e));
      }
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleRevokeRemote = async () => {
    setError(null);
    setSuccess(null);
    try {
      await profileService.revokeRemoteSessions();
      setSessionsSupported(true);
      await reloadSessions();
      setSuccess('Sesiones remotas cerradas');
    } catch (e: any) {
      if (e?.code === 'FEATURE_UNAVAILABLE') {
        setSessionsSupported(false);
        setError('Próximamente');
      } else {
        setError(mapHttpError(e));
      }
    }
  };

  const handleRevokeOne = async (id: string) => {
    setError(null);
    setSuccess(null);
    try {
      await profileService.revokeSession(id);
      setSessionsSupported(true);
      await reloadSessions();
      setSuccess('Sesión remota cerrada');
    } catch (e: any) {
      if (e?.code === 'FEATURE_UNAVAILABLE') {
        setSessionsSupported(false);
        setError('Próximamente');
      } else {
        setError(mapHttpError(e));
      }
    }
  };

  const handleDeleteAccount = async () => {
    setError(null);
    setSuccess(null);
    try {
      await profileService.deleteAccount();
      setDeleteSupported(true);
      await logout();
      navigate('/register');
    } catch (e: any) {
      if (e?.code === 'FEATURE_UNAVAILABLE') {
        setDeleteSupported(false);
        setError('Próximamente');
      } else {
        setError(mapHttpError(e));
      }
    }
  };

  if (loading) {
    return <div className="px-6 pt-20 text-center py-12">Cargando perfil...</div>;
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto px-6 pt-20 pb-6 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Perfil de Usuario</h1>

        {(error || success) && (
          <div
            className={`rounded border p-3 text-sm mb-4 ${
              error
                ? 'border-destructive/30 bg-destructive/10 text-destructive'
                : 'border-border bg-muted text-foreground'
            }`}
          >
            {error || success}
          </div>
        )}

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mi Perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!editing ? (
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="font-medium">Nombre:</span> {profile?.name || user?.name || '—'}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {profile?.email || user?.email || '—'}
                  </div>
                  <div>
                    <span className="font-medium">Miembro desde:</span> {profile ? formatMemberSince(profile.created_at) : '—'}
                  </div>
                  <div>
                    <span className="font-medium">Biografía:</span> {profile?.bio || '—'}
                  </div>
                  <div>
                    <span className="font-medium">Teléfono:</span> {profile?.phone || '—'}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Nombre</div>
                    <Input value={draftName} onChange={(e) => setDraftName(e.target.value)} />
                    {fieldErrors.name && <div className="text-sm text-destructive">{fieldErrors.name}</div>}
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Email</div>
                    <Input value={draftEmail} onChange={(e) => setDraftEmail(e.target.value)} />
                    {fieldErrors.email && <div className="text-sm text-destructive">{fieldErrors.email}</div>}
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Biografía</div>
                    <Textarea value={draftBio} onChange={(e) => setDraftBio(e.target.value)} rows={3} />
                    {fieldErrors.bio && <div className="text-sm text-destructive">{fieldErrors.bio}</div>}
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Teléfono</div>
                    <Input value={draftPhone} onChange={(e) => setDraftPhone(e.target.value)} />
                    {fieldErrors.phone && <div className="text-sm text-destructive">{fieldErrors.phone}</div>}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    setError(null);
                    setSuccess(null);
                    setEditing(true);
                  }}
                >
                  [Editar Perfil]
                </Button>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} className="inline-flex">
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => {
                          setShowPasswordForm((v) => !v);
                          setError(null);
                          setSuccess(null);
                        }}
                        disabled={!passwordSupported}
                      >
                        [Cambiar Contraseña]
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!passwordSupported && <TooltipContent>Próximamente</TooltipContent>}
                </Tooltip>

                <Button
                  type="button"
                  variant="link"
                  onClick={async () => {
                    await logout();
                    navigate('/login');
                  }}
                >
                  [Cerrar sesión]
                </Button>
              </div>

              {editing && (
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Button type="button" onClick={handleSaveProfile}>
                    Guardar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDraftName(profile?.name || user?.name || '');
                      setDraftEmail(profile?.email || user?.email || '');
                      setDraftBio(profile?.bio || '');
                      setDraftPhone(profile?.phone || '');
                      setEditing(false);
                      setFieldErrors({});
                      setError(null);
                      setSuccess(null);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              )}

              {showPasswordForm && (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" onClick={() => setPwVisible((v) => !v)}>
                      {pwVisible ? 'Ocultar' : 'Mostrar'} contraseñas
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Actual</div>
                      <Input
                        type={pwVisible ? 'text' : 'password'}
                        value={pwCurrent}
                        onChange={(e) => setPwCurrent(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Nueva</div>
                      <Input type={pwVisible ? 'text' : 'password'} value={pwNext} onChange={(e) => setPwNext(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Confirmar</div>
                      <Input
                        type={pwVisible ? 'text' : 'password'}
                        value={pwConfirm}
                        onChange={(e) => setPwConfirm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" onClick={handleChangePassword} disabled={pwSaving}>
                      {pwSaving ? 'Cambiando…' : 'Cambiar contraseña'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPwCurrent('');
                        setPwNext('');
                        setPwConfirm('');
                        setPwVisible(false);
                        setError(null);
                        setSuccess(null);
                      }}
                      disabled={pwSaving}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sesiones activas:</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sessionsSupported === false ? (
                <div className="text-sm text-muted-foreground">Próximamente</div>
              ) : sessions.length === 0 ? (
                <div className="text-sm text-muted-foreground">No hay sesiones para mostrar.</div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((s) => (
                    <div key={s.id} className="rounded border border-border p-3">
                      <div className="text-sm font-medium">{s.device}</div>
                      <div className="text-sm text-muted-foreground">📍 {s.ip}</div>
                      <div className="text-sm text-muted-foreground">Conectado {timeAgo(s.last_active)}</div>

                      <div className="pt-2">
                        <Button
                          type="button"
                          variant="link"
                          onClick={async () => {
                            if (s.current) {
                              await logout();
                              navigate('/login');
                              return;
                            }
                            await handleRevokeOne(s.id);
                          }}
                          disabled={!sessionsSupported}
                        >
                          [Cerrar sesión]
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} className="inline-flex">
                      <Button
                        type="button"
                        variant="link"
                        onClick={handleRevokeRemote}
                        disabled={!sessionsSupported}
                      >
                        [Cerrar todas las sesiones]
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!sessionsSupported && <TooltipContent>Próximamente</TooltipContent>}
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} className="inline-flex">
                      <Button
                        type="button"
                        variant="link"
                        onClick={handleDeleteAccount}
                        disabled={!deleteSupported}
                      >
                        [Eliminar cuenta]
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!deleteSupported && <TooltipContent>Próximamente</TooltipContent>}
                </Tooltip>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Profile;
