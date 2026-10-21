import { create } from 'zustand'
import { documentApi } from '../services/documentApi'
import { toApiError } from '../services/http'
import type { DocumentMetadata } from '../types/document'
import { useAuthStore } from './authStore'

export type SidebarTab = 'documents' | 'chats'

const isDesktop = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches

interface AppState {
  // knowledge base
  documents: DocumentMetadata[]
  documentsLoading: boolean
  /** true while refreshing (spins the refresh button) */
  documentsRefreshing: boolean
  documentsError: string
  /** null = "All Documents" scope; shared by Chat, Search and Chunks */
  selectedDocumentId: string | null
  // layout
  activeTab: SidebarTab
  sidebarOpen: boolean
  // upload dialog
  uploadOpen: boolean
  droppedFile: File | null

  fetchDocuments: () => Promise<void>
  removeDocument: (id: string) => Promise<void>
  selectDocument: (id: string | null) => void
  setActiveTab: (tab: SidebarTab) => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  openUpload: (file?: File | null) => void
  closeUpload: () => void
  reset: () => void
}

const initial = () => ({
  documents: [] as DocumentMetadata[],
  documentsLoading: true,
  documentsRefreshing: false,
  documentsError: '',
  selectedDocumentId: null as string | null,
  activeTab: 'documents' as SidebarTab,
  sidebarOpen: isDesktop(),
  uploadOpen: false,
  droppedFile: null as File | null,
})

export const useAppStore = create<AppState>((set, get) => ({
  ...initial(),

  fetchDocuments: async () => {
    set({ documentsRefreshing: true })
    try {
      const documents = await documentApi.list()
      const { selectedDocumentId } = get()
      set({
        documents,
        documentsError: '',
        // a deleted document falls back to the All Documents scope
        selectedDocumentId: documents.some((d) => d.id === selectedDocumentId) ? selectedDocumentId : null,
      })
    } catch (err) {
      set({ documentsError: toApiError(err).message })
    } finally {
      set({ documentsLoading: false, documentsRefreshing: false })
    }
  },

  removeDocument: async (id) => {
    await documentApi.remove(id)
    await get().fetchDocuments()
  },

  selectDocument: (selectedDocumentId) => set({ selectedDocumentId }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  openUpload: (file = null) => set({ uploadOpen: true, droppedFile: file }),
  closeUpload: () => set({ uploadOpen: false, droppedFile: null }),
  reset: () => set({ ...initial() }),
}))

// Reset on sign-out or user change so users never see each other's data.
useAuthStore.subscribe((state, prev) => {
  if (state.session?.user.id !== prev.session?.user.id) useAppStore.getState().reset()
})
