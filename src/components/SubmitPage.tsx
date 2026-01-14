import { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { CATEGORIES, MOCK_AVATARS, type Avatar } from '../logic/mockData';
import { AvatarPicker } from './AvatarPicker';
import { CreateAvatarOverlay } from './CreateAvatarOverlay';
import { EnterPasskeyOverlay } from './EnterPasskeyOverlay';

export function SubmitPage() {
  // FORM STATE
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // IDENTITY STATE
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [showCreateOverlay, setShowCreateOverlay] = useState(false);
  const [showPasskeyOverlay, setShowPasskeyOverlay] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // MOCKED AVATARS (In real app, fetch this)
  const avatars = Object.values(MOCK_AVATARS);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };

  const handleAvatarSelect = (avatar: Avatar) => {
    setSelectedAvatar(avatar);
    setShowPasskeyOverlay(true);
  };

  const handlePasskeySuccess = () => {
    setShowPasskeyOverlay(false);
    
    // SUBMIT LOGIC HERE
    console.log("Submitting:", { title, category, description, image, avatarId: selectedAvatar?.id });
    setIsSuccess(true);
  };

  if (isSuccess) {
      return (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-500">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
                  <img src="/src/assets/icons/status-success.svg" className="w-8 h-8" alt="Success" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Design Submitted!</h1>
              <p className="text-gray-500 max-w-md">Your work has been posted successfully. Get ready for some honest feedback.</p>
              <Button className="mt-8" onClick={() => window.location.reload()}>Post Another</Button>
          </div>
      );
  }

  return (
    <div className="max-w-3xl mx-auto pb-20">
      
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Submit Work</h1>
        <p className="text-gray-500">Share your latest design for structured critique.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* LEFT COLUMN: CONTENT FORM */}
        <div className="space-y-6">
           
           {/* IMAGE UPLOAD */}
           <div className="group relative w-full aspect-4/3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer overflow-hidden">
               <input 
                 type="file" 
                 accept="image/*" 
                 className="absolute inset-0 opacity-0 cursor-pointer z-10"
                 onChange={handleImageUpload}
               />
               
               {imagePreview ? (
                   <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
               ) : (
                   <>
                     <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3">
                        <img src="/src/assets/icons/upload.svg" className="w-5 h-5 opacity-60" alt="Upload" />
                     </div>
                     <p className="text-sm font-medium text-gray-500 group-hover:text-black transition-colors">Upload Design</p>
                     <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                   </>
               )}
           </div>

           <div className="space-y-4">
                <Input 
                    placeholder="Project Title" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                
                <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setCategory(cat)}
                            className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
                                category === cat 
                                ? 'bg-black text-white border-black' 
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <Textarea 
                    placeholder="Description (Context, Goal, Role...)" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
           </div>
        </div>


        {/* RIGHT COLUMN: IDENTITY */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-fit sticky top-24">
            <div className="mb-6">
                <h3 className="font-bold text-lg">Attribution</h3>
                <p className="text-xs text-gray-400 mt-1">Select who is posting this work.</p>
                
                <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-xs rounded-xl flex gap-2">
                     <span className="shrink-0">ℹ️</span>
                     <p>Rater is a meritocracy. Attribution is claimed by the submitter and not independently verified.</p>
                </div>
            </div>

            <AvatarPicker 
                avatars={avatars} 
                selectedAvatarId={selectedAvatar?.id}
                onSelect={handleAvatarSelect}
                onCreateNew={() => setShowCreateOverlay(true)}
            />
            
            <div className="mt-6 pt-6 border-t border-gray-100">
                <Button 
                    className="w-full" 
                    disabled={!title || !category || !image || !selectedAvatar}
                    onClick={() => {
                        // In real flow, this might trigger passkey again if not just verified
                        if (selectedAvatar) setShowPasskeyOverlay(true)
                    }}
                >
                    Post Work
                </Button>
            </div>
        </div>

      </div>

      {/* OVERLAYS */}
      {showCreateOverlay && (
          <CreateAvatarOverlay 
            onClose={() => setShowCreateOverlay(false)}
            onCreate={(name, _passkey) => {
                console.log("Creating:", name);
                setShowCreateOverlay(false);
                // In real app, this would modify the mock data
            }}
          />
      )}

      {showPasskeyOverlay && selectedAvatar && (
          <EnterPasskeyOverlay 
             avatar={selectedAvatar}
             onClose={() => setShowPasskeyOverlay(false)}
             onSuccess={handlePasskeySuccess}
          />
      )}

    </div>
  );
}
