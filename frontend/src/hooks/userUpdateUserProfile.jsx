import { useQueryClient, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";


const useUpdateUserProfile = () => {

    const queryClient = useQueryClient();

    const {mutateAsync: updateProfile, isPending: isUpdatingProfile} = useMutation({
        mutationFn: async (formData) => {
            try{
                const res = await fetch('/api/users/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                })

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'something went wrong');
                return data;
            }catch(err){
                throw new Error(err);
            }
        },
        onSuccess: () => {
            toast.success('profile updated successfully');
            document.getElementById("edit_profile_modal").close();
            Promise.all([
                queryClient.invalidateQueries({queryKey: ['authUser']}),
                queryClient.invalidateQueries({queryKey: ['userProfile']})
            ])
        },
        onError: (error) => {
            toast.error(error.message);
        }
    })

    return {updateProfile, isUpdatingProfile};
}

export default useUpdateUserProfile;