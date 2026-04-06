import ExploreScreen from '@/features/explore/screen/ExploreScreen'

export default {
  name: 'explore',
  routes: [
    { path: '/explore', element: <ExploreScreen />, public: false }
  ]
}
