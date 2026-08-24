


import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";


const useFollow = () => {
    const queryClient = useQueryClient();

    const {mutate:follow, isPending} = useMutation({
        mutationFn: async (userId) => {
            try{
                const res = await fetch(`/api/users/follow/${userId}`, {method: 'POST'});
                const data = await res.json();
                
                if (!res.ok) throw new Error(data.error || 'something went wrong');
                return data;
            }catch(err){
                throw new Error(err.message);
            }
        },
        onSuccess: ()=>{
            Promise.all([
                queryClient.invalidateQueries({queryKey: ['suggestedUsers']}),
                queryClient.invalidateQueries({queryKey: ['authUser']})
            ]);
        },
        onError: (err)=>{
            toast.error(err.message);
        }
    });

    return {follow, isPending};
}


export default useFollow;