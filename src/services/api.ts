import { supabase } from '../lib/supabase';
import { User, Batiment, Membre, Ressource } from '../types';

export const api = {
  // ---- UTILISATEURS ----
  async getUserDetails(userId: string) {
    const { data, error } = await supabase
      .from('utilisateurs')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  async updateUserDetails(userId: string, updates: Partial<any>) {
    const { data, error } = await supabase
      .from('utilisateurs')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ---- BATIMENTS ----
  async getBatimentDetails(batimentId: string | number) {
    const { data, error } = await supabase
      .from('batiments')
      .select('*')
      .eq('id', batimentId)
      .single();
    if (error) throw error;
    return data;
  },

  async createBatiment(batimentData: any) {
    const { data, error } = await supabase
      .from('batiments')
      .insert(batimentData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteBatiment(batimentId: string | number) {
    const { data, error } = await supabase
      .from('batiments')
      .delete()
      .eq('id', batimentId)
      .select();
    if (error) throw error;
    return data;
  },

  // ---- MEMBRES BATIMENTS ----
  async getMemberships(userId: string) {
    const { data, error } = await supabase
      .from('membres_batiments')
      .select(`
        id,
        role,
        batiment_id,
        Batiments:batiments (
          id, nom, code_invitation, description, adresse, avatar_url, banner_url, mot_de_passe,
          autres_membres:membres_batiments (
            role,
            utilisateurs (id, first_name, last_name, avatar_url)
          )
        )
      `)
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  },

  async getLocataires(batimentId: string | number) {
    const { data, error } = await supabase
      .from('membres_batiments')
      .select(`
        id, 
        role,
        Utilisateurs:user_id (id, first_name, last_name, avatar_url, profession)
      `)
      .eq('batiment_id', batimentId)
      .eq('role', 'locataire');
    if (error) throw error;
    return data;
  },

  async addMember(userId: string, batimentId: string | number, role: 'proprio' | 'locataire') {
    const { data, error } = await supabase
      .from('membres_batiments')
      .insert({ user_id: userId, batiment_id: batimentId, role })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async removeMember(userId: string, batimentId: string | number) {
    const { data: member } = await supabase
      .from('membres_batiments')
      .select('id')
      .eq('batiment_id', batimentId)
      .eq('user_id', userId)
      .single();
      
    if (member && member.id) {
      const { data, error } = await supabase
        .from('membres_batiments')
        .delete()
        .eq('id', member.id)
        .select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Action refusée (RLS). Vérifiez que vous avez le droit de supprimer ce membre.");
      return data;
    } else {
      // Fallback
      const { data, error } = await supabase
        .from('membres_batiments')
        .delete()
        .eq('batiment_id', batimentId)
        .eq('user_id', userId)
        .select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Action refusée (RLS) ou membre introuvable.");
      return data;
    }
  },

  // ---- DEMANDES ADHESION ----
  async getDemandes(batimentId: string | number) {
    const { data, error } = await supabase
      .from('demandes_adhesion')
      .select(`
        id, user_id, status, created_at, 
        Utilisateurs:user_id (first_name, last_name, avatar_url)
      `)
      .eq('batiment_id', batimentId)
      .eq('status', 'pending');
    if (error) throw error;
    return data;
  },

  async createDemande(userId: string, batimentId: string | number) {
    const { data, error } = await supabase
      .from('demandes_adhesion')
      .insert({ user_id: userId, batiment_id: batimentId, status: 'pending' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateDemandeStatus(demandeId: number, status: 'accepted' | 'rejected') {
    const { data, error } = await supabase
      .from('demandes_adhesion')
      .update({ status })
      .eq('id', demandeId)
      .select();
    if (error) throw error;
    return data;
  },

  // ---- ANNONCES ----
  async getAnnonces(batimentId: string | number) {
    const { data, error } = await supabase
      .from('annonces')
      .select(`
        id, titre, contenu, created_at,
        Utilisateurs:author_id (first_name, last_name, avatar_url)
      `)
      .eq('batiment_id', batimentId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createAnnonce(annonceData: any) {
    const { data, error } = await supabase
      .from('annonces')
      .insert(annonceData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteAnnonce(annonceId: number | string) {
    const { data, error } = await supabase
      .from('annonces')
      .delete()
      .eq('id', annonceId)
      .select();
    if (error) throw error;
    return data;
  },

  // ---- RESSOURCES ----
  async getRessources(batimentId: string | number) {
    const { data, error } = await supabase
      .from('ressources')
      .select('*')
      .eq('batiment_id', batimentId)
      .order('name');
    if (error) throw error;
    return data;
  },

  async createRessource(ressourceData: any) {
    const { data, error } = await supabase
      .from('ressources')
      .insert(ressourceData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateRessource(ressourceId: number | string, ressourceData: any) {
    const { data, error } = await supabase
      .from('ressources')
      .update(ressourceData)
      .eq('id', ressourceId)
      .select();
    if (error) throw error;
    return data;
  },

  async deleteRessource(ressourceId: number | string) {
    const { data, error } = await supabase
      .from('ressources')
      .delete()
      .eq('id', ressourceId)
      .select();
    if (error) throw error;
    return data;
  },

  // ---- INTERACTIONS (TICKETS) ----
  async getInteractions(batimentId: string | number, restrictToUserId?: string) {
    // Nous devons récupérer les ressources d'abord pour avoir les IDs
    const { data: resData, error: resError } = await supabase
      .from('ressources')
      .select('id')
      .eq('batiment_id', batimentId);
    if (resError) throw resError;
    if (!resData || resData.length === 0) return [];

    const resourceIds = resData.map(r => r.id);

    let query = supabase
      .from('interactions')
      .select(`
        id, issue_description, photo_url, status, created_at, admin_reply, resident_id,
        Ressources:area_id (id, name),
        Utilisateurs:resident_id (first_name, last_name, avatar_url)
      `)
      .in('area_id', resourceIds)
      .order('created_at', { ascending: false });

    if (restrictToUserId) {
      query = query.eq('resident_id', restrictToUserId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async createInteraction(interactionData: any) {
    const { data, error } = await supabase
      .from('interactions')
      .insert(interactionData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateInteractionReply(ticketId: number | string, reply: string) {
    const { data, error } = await supabase
      .from('interactions')
      .update({ admin_reply: reply, status: 'resolved' })
      .eq('id', ticketId)
      .select();
    if (error) throw error;
    return data;
  },

  async updateInteractionStatus(ticketId: number | string, status: 'pending' | 'in_progress' | 'resolved') {
    const { data, error } = await supabase
      .from('interactions')
      .update({ status })
      .eq('id', ticketId)
      .select();
    if (error) throw error;
    return data;
  },

  // ---- MEMBRES: ROLE MANAGEMENT ----
  async updateMemberRole(userId: string, batimentId: string | number, newRole: 'proprio' | 'locataire') {
    const { data, error } = await supabase
      .from('membres_batiments')
      .update({ role: newRole })
      .eq('user_id', userId)
      .eq('batiment_id', batimentId)
      .select();
    if (error) throw error;
    return data;
  },

  async getAllMembers(batimentId: string | number) {
    const { data, error } = await supabase
      .from('membres_batiments')
      .select(`
        id, 
        role,
        Utilisateurs:user_id (id, first_name, last_name, avatar_url, profession)
      `)
      .eq('batiment_id', batimentId);
    if (error) throw error;
    return data;
  },

  // ---- MESSAGES ----
  async getMessages(userId1: string, userId2: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  async sendMessage(senderId: string, receiverId: string, contenu: string) {
    const { data, error } = await supabase
      .from('messages')
      .insert({ sender_id: senderId, receiver_id: receiverId, contenu })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
