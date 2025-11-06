import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const app = new Hono()

// CORS middleware - must respond with open CORS headers
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Logger middleware
app.use('*', logger(console.log))

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Helper function to verify user authentication
async function verifyUser(authHeader: string | null) {
  if (!authHeader) {
    return { user: null, error: 'No authorization header' }
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    return { user: null, error: 'No token provided' }
  }

  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return { user: null, error: 'Invalid token or user not found' }
  }

  return { user, error: null }
}

// Health check
app.get('/make-server-3e6b72d9/health', (c) => {
  return c.json({ status: 'ok', message: 'DevTrack Africa API is running' })
})

// ==================== AUTH ROUTES ====================

// Sign up
app.post('/make-server-3e6b72d9/signup', async (c) => {
  try {
    const { email, password, fullName, country, phone } = await c.req.json()

    // Create user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { fullName, country, phone },
      email_confirm: true // Auto-confirm email
    })

    if (error) {
      console.error('Signup error:', error)
      return c.json({ success: false, message: error.message }, 400)
    }

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: data.user.id,
        full_name: fullName || email.split('@')[0],
        email,
        country: country || '',
        phone: phone || ''
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
    }

    return c.json({ 
      success: true, 
      message: 'Account created successfully',
      user: data.user 
    })
  } catch (error: any) {
    console.error('Signup error:', error)
    return c.json({ success: false, message: error.message || 'Failed to create account' }, 500)
  }
})

// ==================== PROJECT ROUTES ====================

// Get user projects
app.get('/make-server-3e6b72d9/projects', async (c) => {
  const { user, error: authError } = await verifyUser(c.req.header('Authorization'))
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401)
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return c.json({ projects: data || [] })
  } catch (error: any) {
    console.error('Get projects error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Get public projects
app.get('/make-server-3e6b72d9/projects/public', async (c) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    return c.json({ projects: data || [] })
  } catch (error: any) {
    console.error('Get public projects error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Create project
app.post('/make-server-3e6b72d9/projects', async (c) => {
  const { user, error: authError } = await verifyUser(c.req.header('Authorization'))
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401)
  }

  try {
    const projectData = await c.req.json()

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        ...projectData
      })
      .select()
      .single()

    if (error) throw error

    return c.json({ project: data })
  } catch (error: any) {
    console.error('Create project error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Update project
app.put('/make-server-3e6b72d9/projects/:id', async (c) => {
  const { user, error: authError } = await verifyUser(c.req.header('Authorization'))
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401)
  }

  try {
    const projectId = c.req.param('id')
    const updates = await c.req.json()

    const { data, error } = await supabase
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return c.json({ project: data })
  } catch (error: any) {
    console.error('Update project error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Delete project
app.delete('/make-server-3e6b72d9/projects/:id', async (c) => {
  const { user, error: authError } = await verifyUser(c.req.header('Authorization'))
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401)
  }

  try {
    const projectId = c.req.param('id')

    // Delete project (tasks will be deleted via CASCADE)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', user.id)

    if (error) throw error

    return c.json({ success: true })
  } catch (error: any) {
    console.error('Delete project error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// ==================== TASK ROUTES ====================

// Get tasks for a project
app.get('/make-server-3e6b72d9/projects/:projectId/tasks', async (c) => {
  const { user, error: authError } = await verifyUser(c.req.header('Authorization'))
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401)
  }

  try {
    const projectId = c.req.param('projectId')

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return c.json({ tasks: data || [] })
  } catch (error: any) {
    console.error('Get tasks error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Get all user tasks
app.get('/make-server-3e6b72d9/tasks', async (c) => {
  const { user, error: authError } = await verifyUser(c.req.header('Authorization'))
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401)
  }

  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return c.json({ tasks: data || [] })
  } catch (error: any) {
    console.error('Get user tasks error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Create task
app.post('/make-server-3e6b72d9/tasks', async (c) => {
  const { user, error: authError } = await verifyUser(c.req.header('Authorization'))
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401)
  }

  try {
    const taskData = await c.req.json()

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        ...taskData
      })
      .select()
      .single()

    if (error) throw error

    return c.json({ task: data })
  } catch (error: any) {
    console.error('Create task error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Update task
app.put('/make-server-3e6b72d9/tasks/:id', async (c) => {
  const { user, error: authError } = await verifyUser(c.req.header('Authorization'))
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401)
  }

  try {
    const taskId = c.req.param('id')
    const updates = await c.req.json()

    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return c.json({ task: data })
  } catch (error: any) {
    console.error('Update task error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Delete task
app.delete('/make-server-3e6b72d9/tasks/:id', async (c) => {
  const { user, error: authError } = await verifyUser(c.req.header('Authorization'))
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401)
  }

  try {
    const taskId = c.req.param('id')

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', user.id)

    if (error) throw error

    return c.json({ success: true })
  } catch (error: any) {
    console.error('Delete task error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// ==================== POSTS ROUTES ====================

// Get public posts
app.get('/make-server-3e6b72d9/posts', async (c) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    return c.json({ posts: data || [] })
  } catch (error: any) {
    console.error('Get posts error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Get user posts
app.get('/make-server-3e6b72d9/posts/user', async (c) => {
  const { user, error: authError } = await verifyUser(c.req.header('Authorization'))
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401)
  }

  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return c.json({ posts: data || [] })
  } catch (error: any) {
    console.error('Get user posts error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Create post
app.post('/make-server-3e6b72d9/posts', async (c) => {
  const { user, error: authError } = await verifyUser(c.req.header('Authorization'))
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401)
  }

  try {
    const postData = await c.req.json()

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        ...postData,
        likes: [],
        comments: []
      })
      .select()
      .single()

    if (error) throw error

    return c.json({ post: data })
  } catch (error: any) {
    console.error('Create post error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Delete post
app.delete('/make-server-3e6b72d9/posts/:id', async (c) => {
  const { user, error: authError } = await verifyUser(c.req.header('Authorization'))
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401)
  }

  try {
    const postId = c.req.param('id')

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', user.id)

    if (error) throw error

    return c.json({ success: true })
  } catch (error: any) {
    console.error('Delete post error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// ==================== ANALYTICS ROUTES ====================

// Get project stats
app.get('/make-server-3e6b72d9/analytics/stats', async (c) => {
  const { user, error: authError } = await verifyUser(c.req.header('Authorization'))
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401)
  }

  try {
    // Get projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)

    if (projectsError) throw projectsError

    // Get tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)

    if (tasksError) throw tasksError

    const stats = {
      totalProjects: projects?.length || 0,
      activeProjects: projects?.filter(p => p.status === 'active').length || 0,
      completedProjects: projects?.filter(p => p.status === 'completed').length || 0,
      totalTasks: tasks?.length || 0,
      completedTasks: tasks?.filter(t => t.status === 'completed').length || 0
    }

    return c.json({ stats })
  } catch (error: any) {
    console.error('Get stats error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// ==================== PROFILE ROUTES ====================

// Get user profile
app.get('/make-server-3e6b72d9/profile', async (c) => {
  const { user, error: authError } = await verifyUser(c.req.header('Authorization'))
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401)
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) throw error

    return c.json({ profile: data })
  } catch (error: any) {
    console.error('Get profile error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Update profile
app.put('/make-server-3e6b72d9/profile', async (c) => {
  const { user, error: authError } = await verifyUser(c.req.header('Authorization'))
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401)
  }

  try {
    const updates = await c.req.json()

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return c.json({ profile: data })
  } catch (error: any) {
    console.error('Update profile error:', error)
    return c.json({ error: error.message }, 500)
  }
})

Deno.serve(app.fetch)
