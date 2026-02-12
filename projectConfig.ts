
// --- CONFIGURACIÓN DEL PROYECTO (MODO PLANTILLA) ---
// 📍 CAMBIAR AQUÍ: Edita estos valores para adaptar la app a tu nuevo negocio en segundos.

export const PROJECT_CONFIG = {
  // Identidad de la Marca
  appName: "POMPINO", // <- Pon el nombre de tu nueva app
  appSubtitle: "By Mati Rosas", // <- Tu subtítulo
  
  // Google Analytics (Measurement ID)
  analyticsId: "G-EW9RBBT6VR",
  
  // Contexto Geográfico para la IA (Mejora la búsqueda)
  country: "Argentina", 
  defaultZone: "Palermo Hollywood, CABA",
  
  // Usuarios y Contraseñas
  // ROLE: 'admin' tiene permisos totales (asignar, borrar, ver todo). 'user' solo ve lo suyo o lo asignado.
  // PASSWORD: Ya no se utiliza (acceso abierto).
  users: [
    { name: 'Mati', password: '', color: 'bg-indigo-500', avatar: 'M', role: 'admin' },
    { name: 'Diego', password: '', color: 'bg-emerald-500', avatar: 'D', role: 'user' },
    { name: 'Gaston', password: '', color: 'bg-orange-500', avatar: 'G', role: 'user' },
    { name: 'TESTER', password: '', color: 'bg-gray-500', avatar: 'T', role: 'user' }
  ]
};

// Helper para obtener credenciales rápidamente
export const getCredentials = () => {
  const creds: Record<string, string> = {};
  PROJECT_CONFIG.users.forEach(u => creds[u.name] = u.password);
  return creds;
};

// Helper para obtener lista de nombres
export const getUserNames = () => PROJECT_CONFIG.users.map(u => u.name);

// Helper para obtener color de avatar
export const getUserColor = (name: string) => {
  const user = PROJECT_CONFIG.users.find(u => u.name === name);
  return user ? user.color : 'bg-gray-500';
};

// Helper para verificar rol de admin
export const isUserAdmin = (name: string) => {
    const user = PROJECT_CONFIG.users.find(u => u.name === name);
    return user?.role === 'admin';
}
