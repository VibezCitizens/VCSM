// src/features/explore/search/components/SearchTabs.jsx
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

// helper: detect "relation does not exist" (42P01)
const isUndefinedTable = (err) =>
  String(err?.code || err?.message || '').includes('42P01') ||
  String(err?.message || '').toLowerCase().includes('does not exist')

// generic safe wrapper: never throw, always return []
const safe = async (fn, { optional = false } = {}) => {
  try {
    const { data, error } = await fn()
    if (error) {
      if (optional && isUndefinedTable(error)) return []
      console.warn('[search] error:', error)
      return []
    }
    return data || []
  } catch (e) {
    if (optional && isUndefinedTable(e)) return []
    console.warn('[search] exception:', e)
    return []
  }
}

export default function SearchTabs({ query, typeFilter }) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!query) {
      setResults([])
      return
    }

    const q = query.trim()
    setLoading(true)
    setError(null)

    // USERS
    const doUsers = async () =>
      (await safe(() =>
        supabase
          .from('profiles')
          .select('id, username, display_name, photo_url')
          .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
          .limit(20)
      )).map(u => ({
        result_type: 'user',
        user_id: u.id,
        username: u.username,
        display_name: u.display_name,
        photo_url: u.photo_url
      }))

    // POSTS (text/image/etc.)
    const doPosts = async () =>
      (await safe(() =>
        supabase
          .from('posts')
          .select('id, user_id, title, text, media_url, media_type, created_at, visibility, deleted')
          .eq('visibility', 'public')
          .eq('deleted', false)
          .or(`title.ilike.%${q}%,text.ilike.%${q}%`)
          .order('created_at', { ascending: false })
          .limit(20)
      )).map(p => ({
        result_type: 'post',
        post_id: p.id,
        user_id: p.user_id,
        title: p.title,
        text: p.text,
        media_url: p.media_url,
        media_type: p.media_type,
        created_at: p.created_at
      }))

    // VIDEOS = posts where media_type = 'video'
    const doVideos = async () =>
      (await safe(() =>
        supabase
          .from('posts')
          .select('id, user_id, title, text, media_url, media_type, created_at, visibility, deleted')
          .eq('media_type', 'video')
          .eq('visibility', 'public')
          .eq('deleted', false)               // ✅ fixed
          .or(`title.ilike.%${q}%,text.ilike.%${q}%`)
          .order('created_at', { ascending: false })
          .limit(20)
      )).map(v => ({
        result_type: 'video',
        video_id: v.id,
        user_id: v.user_id,
        title: v.title,
        description: v.text,
        media_url: v.media_url,
        created_at: v.created_at
      }))

    // GROUPS (optional; skip if table is missing)
    const doGroups = async () =>
      (await safe(() =>
        supabase
          .from('groups') // if this table doesn't exist, we skip without crashing
          .select('id, name, description, created_at')
          .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
          .order('created_at', { ascending: false })
          .limit(20)
      , { optional: true })).map(g => ({
        result_type: 'group',
        group_id: g.id,
        group_name: g.name,
        description: g.description
      }))

    const tasks = []
    if (typeFilter === 'users')       tasks.push(doUsers())
    else if (typeFilter === 'posts')  tasks.push(doPosts())
    else if (typeFilter === 'videos') tasks.push(doVideos())
    else if (typeFilter === 'groups') tasks.push(doGroups())
    else                               tasks.push(doUsers(), doPosts(), doVideos(), doGroups())

    Promise.allSettled(tasks)
      .then((settled) => {
        const flat = settled
          .filter(s => s.status === 'fulfilled')
          .flatMap(s => s.value || [])
        setResults(flat)
      })
      .catch((err) => {
        console.error('Search error', err)
        setError(err?.message || 'Search failed')
      })
      .finally(() => setLoading(false))
  }, [query, typeFilter])

  if (loading) return <div className="p-4 text-center text-white">Searching…</div>
  if (error)   return <div className="p-4 text-center text-red-400">{error}</div>
  if (!results.length)
    return <div className="p-4 text-center text-neutral-400">No results found</div>

  return (
    <div className="px-4 py-2 space-y-4">
      {results.map((item) => {
        switch (item.result_type) {
          case 'user':
            return (
              <div
                key={item.user_id}
                onClick={() => navigate(`/u/${item.username}`)}
                className="flex items-center gap-3 p-3 bg-neutral-800 rounded-xl border border-neutral-700 cursor-pointer hover:bg-neutral-700 transition"
              >
                <img
                  src={item.photo_url || '/avatar.jpg'}
                  alt={item.display_name || item.username}
                  className="w-10 h-10 object-cover rounded-full"
                />
                <div className="flex flex-col">
                  <span className="text-white font-semibold">
                    {item.display_name || 'No Name'}
                  </span>
                  <span className="text-sm text-neutral-400">
                    @{item.username}
                  </span>
                </div>
              </div>
            )

          case 'post':
            return (
              <div
                key={item.post_id}
                onClick={() => navigate(`/noti/post/${item.post_id}`)}
                className="p-3 bg-neutral-900 rounded-xl border border-neutral-700 cursor-pointer hover:bg-neutral-800 transition"
              >
                <div className="text-sm text-neutral-200 whitespace-pre-line">
                  {item.title ? `${item.title}\n` : ''}{item.text || '(no text)'}
                </div>
              </div>
            )

          case 'video':
            return (
              <div
                key={item.video_id}
                onClick={() => navigate(`/video/${item.video_id}`)}
                className="p-3 bg-neutral-900 rounded-xl border border-neutral-700 cursor-pointer hover:bg-neutral-800 transition"
              >
                <div className="text-sm text-neutral-200">
                  {item.title || '(untitled video)'}
                </div>
              </div>
            )

          case 'group':
            return (
              <div
                key={item.group_id}
                onClick={() => navigate(`/groups/${item.group_id}`)}   
                className="p-3 bg-neutral-900 rounded-xl border border-neutral-700 cursor-pointer hover:bg-neutral-800 transition"
              >
                <div className="text-sm text-neutral-200">
                  {item.group_name}
                </div>
              </div>
            )

          default:
            return null
        }
      })}
    </div>
  )
}
