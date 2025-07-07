import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient';


export default function StoriesScreen() {
  const [storiesByUser, setStoriesByUser] = useState({})

  useEffect(() => {
    const loadStories = async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(*)')
        .eq('post_type', 'story')
        .gte('created_at', since)
        .order('created_at', { ascending: true })

      if (!error && data) {
        const grouped = {}
        data.forEach((story) => {
          const uid = story.author_id
          if (!grouped[uid]) grouped[uid] = { profile: story.profiles, items: [] }
          grouped[uid].items.push(story)
        })
        setStoriesByUser(grouped)
      }
    }

    loadStories()
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-white mb-4">Stories</h1>
      <div className="flex overflow-x-auto space-x-4">
        {Object.values(storiesByUser).map(({ profile, items }) => (
          <div key={profile.id} className="flex flex-col items-center">
            <img
              src={profile.photo_url || '/default.png'}
              className="w-16 h-16 rounded-full border-2 border-purple-500"
              alt={profile.display_name}
            />
            <p className="text-xs text-white mt-1">{profile.display_name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
