// src/features/explore/components/SearchTabs.jsx
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

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

    setLoading(true)
    setError(null)

    // build queries
    const calls = []

    const doUsers = () =>
      supabase
        .from('profiles')
        .select('id, username, display_name, photo_url')
        .ilike('username', `%${query}%`)
        .or(`display_name.ilike.%${query}%`)
        .limit(20)
        .then(({ data, error }) => {
          if (error) throw error
          // rename `id` → `user_id` in JS
          return data.map((u) => ({
            user_id: u.id,
            username: u.username,
            display_name: u.display_name,
            photo_url: u.photo_url,
            result_type: 'user',
          }))
        })

    const doPosts = () =>
      supabase
        .from('posts')
        .select('id, content, user_id')
        .ilike('content', `%${query}%`)
        .limit(20)
        .then(({ data, error }) => {
          if (error) throw error
          return data.map((p) => ({
            post_id: p.id,
            content: p.content,
            user_id: p.user_id,
            result_type: 'post',
          }))
        })

    const doVideos = () =>
      supabase
        .from('videos')
        .select('id, title, description, user_id')
        .ilike('title', `%${query}%`)
        .or(`description.ilike.%${query}%`)
        .limit(20)
        .then(({ data, error }) => {
          if (error) throw error
          return data.map((v) => ({
            video_id:   v.id,
            title:      v.title,
            description:v.description,
            user_id:    v.user_id,
            result_type:'video',
          }))
        })

    const doGroups = () =>
      supabase
        .from('groups')
        .select('id, group_name, description')
        .ilike('group_name', `%${query}%`)
        .or(`description.ilike.%${query}%`)
        .limit(20)
        .then(({ data, error }) => {
          if (error) throw error
          return data.map((g) => ({
            group_id:    g.id,
            group_name:  g.group_name,
            description: g.description,
            result_type: 'group',
          }))
        })

    if (typeFilter === 'users')      calls.push(doUsers())
    else if (typeFilter === 'posts') calls.push(doPosts())
    else if (typeFilter === 'videos')calls.push(doVideos())
    else if (typeFilter === 'groups')calls.push(doGroups())
    else                              calls.push(doUsers(), doPosts(), doVideos(), doGroups())

    Promise.all(calls)
      .then((all) => setResults(all.flat()))
      .catch((err) => {
        console.error('Search error', err)
        setError(err.message || 'Search failed')
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
                  {item.content}
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
                  {item.title}
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
