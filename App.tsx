
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Folder, 
  File, 
  Image as ImageIcon, 
  Video, 
  Music, 
  Code, 
  Archive, 
  Plus, 
  Trash2, 
  Search, 
  Maximize2, 
  X,
  Info,
  ChevronRight,
  Download,
  Upload
} from 'lucide-react';
import { StorageService } from './services/storageService';
import { GeminiService } from './services/geminiService';
import { StoredFile, FileCategory, FileInsight } from './types';

const App: React.FC = () => {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<StoredFile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FileCategory | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');

  // Load files on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await StorageService.init();
        const stored = await StorageService.getAllFiles();
        setFiles(stored);
      } catch (err) {
        console.error("Failed to load files", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const pickedFiles = event.target.files;
    if (!pickedFiles) return;

    setIsUploading(true);
    const newFiles: StoredFile[] = [];

    for (let i = 0; i < pickedFiles.length; i++) {
      const file = pickedFiles[i];
      const category = StorageService.getCategory(file.type, file.name);
      
      const storedFile: StoredFile = {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        category,
        blob: file,
        path: '/'
      };

      await StorageService.saveFile(storedFile);
      newFiles.push(storedFile);
    }

    setFiles(prev => [...prev, ...newFiles]);
    setIsUploading(false);
    // Reset input
    event.target.value = '';
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this file permanently?')) {
      await StorageService.deleteFile(id);
      setFiles(prev => prev.filter(f => f.id !== id));
      if (selectedFile?.id === id) setSelectedFile(null);
    }
  };

  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'ALL' || f.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [files, searchQuery, activeCategory]);

  const stats = useMemo(() => {
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    return {
      total: files.length,
      sizeFormatted: (totalSize / (1024 * 1024)).toFixed(2) + ' MB'
    };
  }, [files]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Folder size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">OmniView Explorer</h1>
        </div>

        <div className="flex-1 max-w-xl mx-8 relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search local storage..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl transition-all outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors shadow-sm">
            <Upload size={18} />
            <span className="hidden sm:inline">Import Files</span>
            <input type="file" multiple className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Desktop */}
        <aside className="w-64 bg-white border-r hidden lg:flex flex-col p-4">
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">Storage</h2>
            <nav className="space-y-1">
              <SidebarItem 
                icon={<Folder size={20} />} 
                label="All Files" 
                active={activeCategory === 'ALL'} 
                onClick={() => setActiveCategory('ALL')}
              />
              <SidebarItem 
                icon={<ImageIcon size={20} />} 
                label="Images" 
                active={activeCategory === FileCategory.IMAGE} 
                onClick={() => setActiveCategory(FileCategory.IMAGE)}
              />
              <SidebarItem 
                icon={<Video size={20} />} 
                label="Videos" 
                active={activeCategory === FileCategory.VIDEO} 
                onClick={() => setActiveCategory(FileCategory.VIDEO)}
              />
              <SidebarItem 
                icon={<Music size={20} />} 
                label="Audio" 
                active={activeCategory === FileCategory.AUDIO} 
                onClick={() => setActiveCategory(FileCategory.AUDIO)}
              />
              <SidebarItem 
                icon={<File size={20} />} 
                label="Documents" 
                active={activeCategory === FileCategory.DOCUMENT} 
                onClick={() => setActiveCategory(FileCategory.DOCUMENT)}
              />
              <SidebarItem 
                icon={<Code size={20} />} 
                label="Code" 
                active={activeCategory === FileCategory.CODE} 
                onClick={() => setActiveCategory(FileCategory.CODE)}
              />
            </nav>
          </div>

          <div className="mt-auto p-4 bg-gray-50 rounded-2xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Local Storage</span>
              <span className="text-xs text-gray-500">{stats.sizeFormatted}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '45%' }}></div>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">Simulated internal storage access</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-gray-50">
          {/* Mobile Categories Scroll */}
          <div className="lg:hidden flex gap-2 p-4 overflow-x-auto no-scrollbar border-b bg-white">
             {['ALL', ...Object.values(FileCategory)].map(cat => (
               <button 
                key={cat}
                onClick={() => setActiveCategory(cat as any)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
               >
                 {cat === 'ALL' ? 'All Files' : cat.charAt(0) + cat.slice(1).toLowerCase()}
               </button>
             ))}
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p>Accessing storage...</p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-20">
                <div className="bg-gray-100 p-8 rounded-full mb-6">
                  <Folder size={64} />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No files found</h3>
                <p className="text-center max-w-xs">Start by importing files from your device to view and manage them here.</p>
              </div>
            ) : (
              <div className={viewMode === 'GRID' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6" : "flex flex-col gap-2"}>
                {filteredFiles.map(file => (
                  <FileCard 
                    key={file.id} 
                    file={file} 
                    viewMode={viewMode}
                    onClick={() => setSelectedFile(file)}
                    onDelete={(e) => handleDelete(file.id, e)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* File Detail / Viewer Modal */}
      {selectedFile && (
        <FileModal 
          file={selectedFile} 
          onClose={() => setSelectedFile(null)} 
          onDelete={() => handleDelete(selectedFile.id, { stopPropagation: () => {} } as any)}
        />
      )}

      {/* Uploading Overlay */}
      {isUploading && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
            <div className="animate-bounce text-blue-600">
              <Upload size={32} />
            </div>
            <p className="font-semibold text-lg">Importing your files...</p>
            <p className="text-sm text-gray-500">Securing data in local indexed storage</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Components
const SidebarItem: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
      active ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
    }`}
  >
    <span className={active ? 'text-blue-600' : 'text-gray-400'}>{icon}</span>
    {label}
  </button>
);

const FileCard: React.FC<{ file: StoredFile, viewMode: 'GRID' | 'LIST', onClick: () => void, onDelete: (e: React.MouseEvent) => void }> = ({ file, viewMode, onClick, onDelete }) => {
  const getIcon = () => {
    switch(file.category) {
      case FileCategory.IMAGE: return <ImageIcon className="text-blue-500" />;
      case FileCategory.VIDEO: return <Video className="text-purple-500" />;
      case FileCategory.AUDIO: return <Music className="text-pink-500" />;
      case FileCategory.CODE: return <Code className="text-emerald-500" />;
      case FileCategory.ARCHIVE: return <Archive className="text-amber-500" />;
      default: return <File className="text-gray-500" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (viewMode === 'LIST') {
    return (
      <div 
        onClick={onClick}
        className="group flex items-center gap-4 p-3 bg-white border border-transparent hover:border-blue-100 hover:bg-blue-50/30 rounded-xl cursor-pointer transition-all"
      >
        <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-white transition-colors">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold truncate text-gray-800">{file.name}</h4>
          <p className="text-xs text-gray-400">{formatSize(file.size)} • {new Date(file.lastModified).toLocaleDateString()}</p>
        </div>
        <button 
          onClick={onDelete}
          className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 size={16} />
        </button>
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className="group bg-white p-4 rounded-2xl border border-transparent hover:border-blue-100 hover:shadow-xl hover:shadow-blue-900/5 cursor-pointer transition-all flex flex-col items-center text-center relative"
    >
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onDelete} className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50">
          <Trash2 size={14} />
        </button>
      </div>
      
      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
        {React.cloneElement(getIcon() as React.ReactElement, { size: 32 })}
      </div>
      
      <h4 className="text-xs font-bold text-gray-800 mb-1 w-full truncate px-1">{file.name}</h4>
      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">{formatSize(file.size)}</p>
    </div>
  );
};

const FileModal: React.FC<{ file: StoredFile, onClose: () => void, onDelete: () => void }> = ({ file, onClose, onDelete }) => {
  const [insight, setInsight] = useState<FileInsight | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file.blob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const analyzeFile = async () => {
    setIsAnalyzing(true);
    try {
      // Get small snippet if it's text-based
      let snippet = "Binary file content";
      if (file.type.startsWith('text/') || file.category === FileCategory.CODE) {
        snippet = await file.blob.slice(0, 2000).text();
      }
      const result = await GeminiService.analyzeFile(file.name, file.type, snippet);
      setInsight(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadFile = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = file.name;
    a.click();
  };

  const renderPreview = () => {
    if (!previewUrl) return null;

    switch(file.category) {
      case FileCategory.IMAGE:
        return <img src={previewUrl} alt={file.name} className="max-w-full max-h-full rounded-lg object-contain" />;
      case FileCategory.VIDEO:
        return <video src={previewUrl} controls className="max-w-full max-h-[70vh] rounded-lg" />;
      case FileCategory.AUDIO:
        return (
          <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
             <Music size={64} className="text-blue-500 mb-6 animate-pulse" />
             <audio src={previewUrl} controls className="w-full" />
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-center">
            <File size={64} className="text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium mb-1">Preview not available for this type</p>
            <p className="text-xs text-gray-400">File Type: {file.type || 'Unknown'}</p>
            <div className="mt-6 flex gap-3">
               <button onClick={downloadFile} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                  <Download size={16} /> Download to System
               </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
        {/* Preview Side */}
        <div className="flex-1 bg-black/5 p-6 flex items-center justify-center overflow-auto min-h-[300px]">
          {renderPreview()}
        </div>

        {/* Info Side */}
        <div className="w-full md:w-80 border-l bg-white p-6 flex flex-col gap-6 overflow-y-auto">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-gray-900 break-words pr-4">{file.name}</h3>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">
                {file.type.split('/')[1] || 'FILE'} • {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <button 
              onClick={analyzeFile}
              disabled={isAnalyzing}
              className={`w-full py-3 px-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all ${
                isAnalyzing ? 'bg-gray-100 text-gray-400' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 active:scale-95 shadow-lg shadow-blue-500/20'
              }`}
            >
              <Info size={18} />
              {isAnalyzing ? 'Analyzing...' : 'AI Smart Analysis'}
            </button>

            {insight && (
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl space-y-3 animate-in fade-in slide-in-from-bottom-2">
                <div>
                  <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">AI Summary</h4>
                  <p className="text-sm text-gray-700 leading-relaxed font-medium">{insight.summary}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Recommended Opening</h4>
                  <p className="text-sm text-gray-700 leading-relaxed font-medium">{insight.suggestedAction}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-auto pt-6 space-y-2">
             <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">File Actions</h4>
             <button onClick={downloadFile} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors">
               <Download size={18} className="text-gray-400" /> Save to Device
             </button>
             <button onClick={() => { onDelete(); onClose(); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-50 text-red-600 text-sm font-semibold transition-colors">
               <Trash2 size={18} /> Delete Permanently
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
