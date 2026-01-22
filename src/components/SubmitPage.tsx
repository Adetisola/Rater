import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/Button';
import { Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { CATEGORIES, type Avatar } from '../logic/mockData';
import { AccessAvatarForm } from './AccessAvatarForm';
import { CreateAvatarOverlay } from './CreateAvatarOverlay';


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
  const [isSuccess, setIsSuccess] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };

  const handleSubmit = () => {
    // SUBMIT LOGIC HERE
    console.log("Submitting:", { title, category, description, image, avatarId: selectedAvatar?.id });
    setIsSuccess(true);
  };

  const handleAvatarAccess = (avatar: Avatar) => {
    setSelectedAvatar(avatar);
  };

  const handleCreateAvatar = (name: string, passkey: string) => {
      // MOCK CREATION
      const newAvatar: Avatar = {
          id: `new-${Date.now()}`,
          name: name,
          passkey: passkey,
          bgColor: '#FEC312', // Default brand color
          isBlocked: false
      };
      
      setSelectedAvatar(newAvatar);
      setShowCreateOverlay(false);
  };

  if (isSuccess) {
      return (
          <div className="min-h-[60vh] w-full flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-500 max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-[#009241]/10 rounded-full flex items-center justify-center mb-6 text-[#009241]">
                  <img src="/src/assets/icons/status-success.svg" className="w-10 h-10" alt="Success" />
              </div>
              <h1 className="text-3xl font-bold mb-4 text-[#111111]">Post Submitted!</h1>
              <p className="text-gray-500 max-w-md mx-auto leading-relaxed">Your design has been posted successfully. The community will start reviewing it shortly.</p>
              <Button className="mt-10 h-12 px-8 rounded-full text-lg font-semibold" variant="outline" onClick={() => window.location.reload()}>Post Another Work</Button>
          </div>
      );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="max-w-[1200px] mx-auto pb-32 pt-8 px-6"
    >
      
      {/* HEADER */}
      <div className="text-left mb-12">
        <h1 className="text-4xl font-bold mb-3 text-[#111111]">Post your Work</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
           
           {/* LEFT COLUMN: Inputs */}
           <div className="space-y-10">
           
               {/* IMAGE UPLOAD */}
               <div className="group relative w-full aspect-video bg-[#F2F2F2] border-2 border-dashed border-[#CCCCCC] rounded-[32px] flex flex-col items-center justify-center hover:bg-surface hover:border-[#FEC312] transition-all cursor-pointer overflow-hidden">
                   <input 
                     type="file" 
                     accept="image/*" 
                     className="absolute inset-0 opacity-0 cursor-pointer z-10"
                     onChange={handleImageUpload}
                   />
                   
                   {imagePreview ? (
                       <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                   ) : (
                       <div className="flex flex-col items-center text-center p-6">
                         <div className="w-16 h-16 mb-4 flex items-center justify-center">
                            <img src="/src/assets/icons/upload.svg" className="w-8 h-8 opacity-40 group-hover:opacity-60 transition-opacity" alt="Upload" />
                         </div>
                         <p className="text-lg font-bold text-[#111111] mb-1">Drop your Design</p>
                         <p className="text-sm text-gray-400">Supports PNG, JPG (Max 10MB)</p>
                       </div>
                   )}
               </div>

               {/* TITLE & DESCRIPTION */}
               <div className="space-y-6">
                    <div>
                         <Input 
                            placeholder="Title" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="h-12 text-base px-4 rounded-xl border border-gray-200 focus-visible:ring-2 focus-visible:ring-[#FEC312]/20 focus-visible:border-[#FEC312] placeholder:text-gray-400 font-medium"
                        />
                    </div>
                    
                    <div className="relative">
                        <Textarea 
                            placeholder="Description" 
                            value={description}
                            maxLength={400}
                            onChange={(e) => setDescription(e.target.value)}
                            className="min-h-[180px] text-sm p-4 pb-8 rounded-xl border border-gray-200 focus-visible:ring-2 focus-visible:ring-[#FEC312]/20 focus-visible:border-[#FEC312] placeholder:text-gray-400 resize-none font-medium"
                        />
                        <div className="absolute bottom-4 right-4 text-xs font-bold text-gray-400 pointer-events-none">
                            {description.length} / 400 chars
                        </div>
                    </div>
               </div>

               {/* CATEGORIES */}
               <div className="space-y-4">
                    <h3 className="font-bold text-lg text-[#111111]">Pick a Category</h3>
                    <div className="flex flex-wrap gap-2.5">
                        {CATEGORIES.map(cat => {
                            const isSelected = category === cat;
                            return (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setCategory(cat)}
                                className={cn(
                                    "group pl-1.5 pr-4 py-2 rounded-full border-2 text-sm font-medium transition-all duration-200 flex items-center gap-1.5",
                                    isSelected 
                                        ? "bg-[#ebebeb] border-[#727272] text-[#111111]" 
                                        : "bg-white border-[#E0E0E0] text-[#111111] hover:bg-[#fafafa]"
                                )}
                            >
                                {/* Toggle Circle Indicator */}
                                <div className={cn(
                                    "w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200",
                                    isSelected
                                        ? "bg-[#FEC312]"
                                        : "border-[1.5px] border-[#E0E0E0]"
                                )}>
                                    {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={4} />}
                                </div>
                                
                                {cat}
                            </button>
                        )})}
                    </div>
               </div>
           </div>

           {/* RIGHT COLUMN: Avatar & Actions */}
           <div className="space-y-6 sticky top-32">
                {/* AVATAR SECTION */}
                {!selectedAvatar ? (
                     <>
                         <div className="bg-white border border-gray-200 rounded-[24px] p-8 shadow-sm flex flex-col items-center justify-center">
                              <div className="flex w-full items-baseline justify-center gap-2 mb-6">
                                 <h3 className="font-bold text-lg text-[#111111]">Post as</h3>
                              </div>
                             <AccessAvatarForm 
                                onSuccess={handleAvatarAccess}
                                onCreateNew={() => setShowCreateOverlay(true)}
                             />
                         </div>
                     </>
                 ) : (
                     // SELECTED AVATAR STATE
                     <div className="space-y-4">
                          <h3 className="font-bold text-lg text-[#111111]">Posting as</h3>
                          
                          <div className="border border-[#FEC312] bg-[#FFFBF0] rounded-[24px] p-6 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
                              <div className="w-16 h-16 rounded-full overflow-hidden mb-3 border-2 border-white shadow-sm">
                                  {selectedAvatar.avatarUrl ? (
                                     <img src={selectedAvatar.avatarUrl} alt={selectedAvatar.name} className="w-full h-full object-cover" />
                                  ) : (
                                      <div 
                                         className="w-full h-full flex items-center justify-center text-white font-bold text-xl"
                                         style={{ backgroundColor: selectedAvatar.bgColor }}
                                      >
                                          {selectedAvatar.name.substring(0, 2).toUpperCase()}
                                      </div>
                                  )}
                              </div>
                              <h4 className="font-bold text-lg text-[#111111] mb-2">{selectedAvatar.name}</h4>
                              
                              <button 
                                 onClick={() => setSelectedAvatar(null)}
                                 className="text-xs font-bold text-gray-500 hover:text-[#111111] underline transition-colors"
                              >
                                  Change Avatar
                              </button>
                          </div>
                     </div>
                 )}

                {/* ACTIONS */}
                <div className="pt-4">
                    <Button 
                        className="w-[100px] h-12 rounded-full text-lg font-semibold" 
                        variant="outline"
                        disabled={!title || !category || !image || !selectedAvatar}
                        onClick={handleSubmit}
                    >
                        Post
                    </Button>
                </div>
           </div>

      </div>

      {/* OVERLAYS */}
      {showCreateOverlay && (
          <CreateAvatarOverlay 
            onClose={() => setShowCreateOverlay(false)}
            onCreate={handleCreateAvatar}
          />
      )}
      
    </motion.div>
  );
}
