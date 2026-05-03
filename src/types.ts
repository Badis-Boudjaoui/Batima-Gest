export type User = { 
  id: string; 
  first_name?: string; 
  last_name?: string;
  avatar_url?: string;
  banner_url?: string;
  profession?: string;
  bio?: string;
  show_rented_buildings?: boolean;
};
export type Batiment = { 
  id: string; 
  nom: string; 
  code_invitation: string;
  description?: string;
  adresse?: string;
  avatar_url?: string;
  banner_url?: string;
  mot_de_passe?: string; // sometimes needed for settings
  autres_membres?: any[];
};
export type Membre = { role: "proprio" | "locataire"; Batiments: Batiment };
export type Ressource = { id: string; name: string; description: string };


