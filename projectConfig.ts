// --- CONFIGURACIÓN DEL PROYECTO (MODO PLANTILLA) ---
// 📍 CAMBIAR AQUÍ: Edita estos valores para adaptar la app a tu nuevo negocio en segundos.

export const PROJECT_CONFIG = {
  // Identidad de la Marca
  appName: "POMPINO", // <- Pon el nombre de tu nueva app
  appSubtitle: "BZS Grupo Bebidas", // <- Tu subtítulo principal
  
  // Contexto Geográfico para la IA (Mejora la búsqueda)
  country: "Argentina", 
  defaultZone: "Palermo Hollywood, CABA",
  
  // Usuarios y Contraseñas
  // ROLE: 'admin' tiene permisos totales (asignar, borrar, ver todo). 'user' solo ve lo suyo o lo asignado.
  // commissionEligible: Si es true, aparece en la tabla de bonos. Si es false (como BZS), solo cuenta para el total.
  users: [
    { name: 'BZS', password: '', color: 'bg-rose-600', avatar: 'B', role: 'admin', commissionEligible: false },
    { name: 'Diego', password: '', color: 'bg-emerald-600', avatar: 'D', role: 'user', commissionEligible: true },
    { name: 'Gaston', password: '', color: 'bg-amber-600', avatar: 'G', role: 'user', commissionEligible: true },
    { name: 'Ezur', password: '', color: 'bg-blue-600', avatar: 'E', role: 'user', commissionEligible: true }
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

// Helper para verificar si aplica bono
export const isCommissionEligible = (name: string) => {
    const user = PROJECT_CONFIG.users.find(u => u.name === name);
    return user?.commissionEligible !== false; // Default true if undefined
}