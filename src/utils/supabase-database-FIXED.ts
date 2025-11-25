import { supabase } from '../lib/supabaseClient'
import { calculateProjectStatus } from './project-status-calculator'

// Project and Task types for Supabase
export interface Project {
  id: string
  userId: string
  title: string
  description: string
  notes?: string
  status: 'planning' | 'active' | 'in_progress' | 'completed' | 'archived'
  priority: 'low' | 'medium' | 'high'
  tags: string[]
  githubUrl?: string
  liveUrl?: string
  techStack: string[]
  isPublic: boolean
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  projectId: string
  userId: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  tags: string[]
  dueDate?: string
  estimatedHours?: number
  actualHours?: number
  timeSpentMinutes?: number
  timerStartTime?: string
  dependencies: string[]
  assignedTo?: string
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  userId: string
  projectId?: string
  title: string
  content: string
  imageUrl?: string
  tags: string[]
  likes: string[]
  comments: Comment[]
  isPublic: boolean
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  postId: string
  userId: string
  content: string
  created_at: string
}

// Get current access token
async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

// Helper to map database fields to camelCase
function mapProjectFromDB(dbProject: any): Project {
  return {
    id: dbProject.id,
    userId: dbProject.user_id,
    title: dbProject.title,
    description: dbProject.description || '',
    notes: dbProject.notes,
    status: dbProject.status,
    priority: dbProject.priority || 'medium',
    tags: dbProject.tags || [],
    githubUrl: dbProject.github_url,
    liveUrl: dbProject.live_url,
    techStack: dbProject.tech_stack || [],
    isPublic: dbProject.is_public || false,
    created_at: dbProject.created_at,
    updated_at: dbProject.updated_at
  }
}

function mapTaskFromDB(dbTask: any): Task {
  return {
    id: dbTask.id,
    projectId: dbTask.project_id,
    userId: dbTask.user_id,
    title: dbTask.title,
    description: dbTask.description || '',
    status: dbTask.status,
    priority: dbTask.priority,
    tags: dbTask.tags || [],
    dueDate: dbTask.due_date,
    estimatedHours: dbTask.estimated_time,
    actualHours: dbTask.actual_hours,
    timeSpentMinutes: dbTask.time_spent || 0,
    timerStartTime: dbTask.timer_start_time,
    dependencies: dbTask.dependencies || [],
    assignedTo: dbTask.assigned_to,
    created_at: dbTask.created_at,
    updated_at: dbTask.updated_at
  }
}

function mapPostFromDB(dbPost: any): Post {
  return {
    id: dbPost.id,
    userId: dbPost.user_id,
    projectId: dbPost.project_id,
    title: dbPost.title,
    content: dbPost.content,
    imageUrl: dbPost.image_url,
    tags: dbPost.tags || [],
    likes: dbPost.likes || [],
    comments: dbPost.comments || [],
    isPublic: dbPost.is_public,
    created_at: dbPost.created_at,
    updated_at: dbPost.updated_at
  }
}

// Map camelCase to database fields
function mapProjectToDB(project: Partial<Project>): any {
  const dbProject: any = {}
  if (project.title !== undefined) dbProject.title = project.title
  if (project.description !== undefined) dbProject.description = project.description
  if (project.notes !== undefined) dbProject.notes = project.notes
  if (project.status !== undefined) dbProject.status = project.status
  if (project.priority !== undefined) dbProject.priority = project.priority
  if (project.tags !== undefined) dbProject.tags = project.tags
  if (project.githubUrl !== undefined) dbProject.github_url = project.githubUrl
  if (project.liveUrl !== undefined) dbProject.live_url = project.liveUrl
  if (project.techStack !== undefined) dbProject.tech_stack = project.techStack
  if (project.isPublic !== undefined) dbProject.is_public = project.isPublic
  return dbProject
}

function mapTaskToDB(task: Partial<Task>): any {
  const dbTask: any = {}
  if (task.projectId !== undefined) dbTask.project_id = task.projectId
  if (task.title !== undefined) dbTask.title = task.title
  if (task.description !== undefined) dbTask.description = task.description
  if (task.status !== undefined) dbTask.status = task.status
  if (task.priority !== undefined) dbTask.priority = task.priority
  if (task.tags !== undefined) dbTask.tags = task.tags
  if (task.dueDate !== undefined) dbTask.due_date = task.dueDate
  if (task.estimatedHours !== undefined) dbTask.estimated_time = task.estimatedHours
  if (task.actualHours !== undefined) dbTask.actual_hours = task.actualHours
  if (task.timeSpentMinutes !== undefined) dbTask.time_spent = task.timeSpentMinutes
  if (task.timerStartTime !== undefined) dbTask.timer_start_time = task.timerStartTime
  if (task.dependencies !== undefined) dbTask.dependencies = task.dependencies
  if (task.assignedTo !== undefined) dbTask.assigned_to = task.assignedTo
  return dbTask
}

function mapPostToDB(post: Partial<Post>): any {
  const dbPost: any = {}
  if (post.projectId !== undefined) dbPost.project_id = post.projectId
  if (post.title !== undefined) dbPost.title = post.title
  if (post.content !== undefined) dbPost.content = post.content
  if (post.imageUrl !== undefined) dbPost.image_url = post.imageUrl
  if (post.tags !== undefined) dbPost.tags = post.tags
  if (post.isPublic !== undefined) dbPost.is_public = post.isPublic
  return dbPost
}

class SupabaseDatabase {
  // Test connection
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase.from('profiles').select('count').limit(0)
      
      if (error) {
        return { 
          success: false, 
          message: `Database connection failed: ${error.message}` 
        }
      }
      
      return { 
        success: true, 
        message: 'Connected to Supabase successfully' 
      }
    } catch (error: any) {
      return { 
        success: false, 
        message: `Database connection error: ${error.message}` 
      }
    }
  }

  // Initialize demo data - DISABLED (no longer needed)
  async initializeDemoData(userId: string): Promise<void> {
    // Demo data initialization is disabled
    // Users can create their own projects through the UI
    console.log('ℹ️ Demo data initialization skipped - users create their own projects')
    return
  }

  // ===================
  // PROJECT METHODS
  // ===================

  async getProjects(userId: string): Promise<Project[]> {
    try {
      console.log('🔍 Fetching projects for user:', userId)
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching projects:', error)
        return []
      }

      const projects = (data || []).map(mapProjectFromDB)
      console.log(`✅ Fetched ${projects.length} projects`)
      return projects
    } catch (error) {
      console.error('Error getting projects:', error)
      return []
    }
  }

  async getPublicProjects(): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching public projects:', error)
        return []
      }

      return (data || []).map(mapProjectFromDB)
    } catch (error) {
      console.error('Error getting public projects:', error)
      return []
    }
  }

  async createProject(userId: string, projectData: Omit<Project, 'id' | 'userId' | 'created_at' | 'updated_at'>): Promise<Project | null> {
    try {
      console.log('🔍 Creating project for user:', userId)
      
      const dbProjectData = {
        ...mapProjectToDB(projectData),
        user_id: userId
      }

      const { data, error } = await supabase
        .from('projects')
        .insert(dbProjectData)
        .select()
        .single()

      if (error) {
        console.error('Error creating project:', error)
        return null
      }

      console.log('✅ Project created successfully:', data.id)
      return mapProjectFromDB(data)
    } catch (error) {
      console.error('Error creating project:', error)
      return null
    }
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<Project | null> {
    try {
      const dbUpdates = mapProjectToDB(updates)

      const { data, error } = await supabase
        .from('projects')
        .update(dbUpdates)
        .eq('id', projectId)
        .select()
        .single()

      if (error) {
        console.error('Error updating project:', error)
        return null
      }

      return mapProjectFromDB(data)
    } catch (error) {
      console.error('Error updating project:', error)
      return null
    }
  }

  async deleteProject(projectId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) {
        console.error('Error deleting project:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error deleting project:', error)
      return false
    }
  }

  // ===================
  // TASK METHODS
  // ===================

  async getProjectTasks(projectId: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true })

      if (error) {
        console.error('Error fetching project tasks:', error)
        return []
      }

      return (data || []).map(mapTaskFromDB)
    } catch (error) {
      console.error('Error getting project tasks:', error)
      return []
    }
  }

  async getUserTasks(userId: string): Promise<Task[]> {
    try {
      console.log('🔍 Fetching tasks for user:', userId)
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching user tasks:', error)
        return []
      }

      const tasks = (data || []).map(mapTaskFromDB)
      console.log(`✅ Fetched ${tasks.length} tasks`)
      return tasks
    } catch (error) {
      console.error('Error getting user tasks:', error)
      return []
    }
  }

  async createTask(taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task | null> {
    try {
      const dbTaskData = {
        ...mapTaskToDB(taskData),
        user_id: taskData.userId,
        project_id: taskData.projectId
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert(dbTaskData)
        .select()
        .single()

      if (error) {
        console.error('Error creating task:', error)
        return null
      }

      return mapTaskFromDB(data)
    } catch (error) {
      console.error('Error creating task:', error)
      return null
    }
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
    try {
      const dbUpdates = mapTaskToDB(updates)

      const { data, error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', taskId)
        .select()
        .single()

      if (error) {
        console.error('Error updating task:', error)
        return null
      }

      return mapTaskFromDB(data)
    } catch (error) {
      console.error('Error updating task:', error)
      return null
    }
  }

  async deleteTask(taskId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) {
        console.error('Error deleting task:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error deleting task:', error)
      return false
    }
  }

  // ===================
  // ANALYTICS METHODS
  // ===================

  async getProjectStats(userId: string): Promise<{
    totalProjects: number
    activeProjects: number
    completedProjects: number
    totalTasks: number
    completedTasks: number
  }> {
    try {
      // Get projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('status')
        .eq('user_id', userId)

      if (projectsError) throw projectsError

      // Get tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('status')
        .eq('user_id', userId)

      if (tasksError) throw tasksError

      const totalProjects = projects?.length || 0
      const activeProjects = projects?.filter(p => p.status === 'active' || p.status === 'in_progress').length || 0
      const completedProjects = projects?.filter(p => p.status === 'completed').length || 0
      const totalTasks = tasks?.length || 0
      const completedTasks = tasks?.filter(t => t.status === 'completed' || t.status === 'done').length || 0

      return {
        totalProjects,
        activeProjects,
        completedProjects,
        totalTasks,
        completedTasks
      }
    } catch (error) {
      console.error('Error getting project stats:', error)
      return {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        totalTasks: 0,
        completedTasks: 0
      }
    }
  }

  // ===================
  // POSTS/SOCIAL METHODS (Stubs for now)
  // ===================

  async getPosts(): Promise<Post[]> {
    console.log('ℹ️ Posts feature not yet implemented')
    return []
  }

  async getUserPosts(userId: string): Promise<Post[]> {
    console.log('ℹ️ Posts feature not yet implemented')
    return []
  }

  async createPost(postData: Omit<Post, 'id' | 'created_at' | 'updated_at' | 'likes' | 'comments'>): Promise<Post | null> {
    console.log('ℹ️ Posts feature not yet implemented')
    return null
  }

  async deletePost(postId: string): Promise<boolean> {
    console.log('ℹ️ Posts feature not yet implemented')
    return false
  }

  async likePost(postId: string, userId: string): Promise<boolean> {
    console.log('ℹ️ Posts feature not yet implemented')
    return false
  }
}

// Export singleton instance
export const supabaseDatabase = new SupabaseDatabase()
export default supabaseDatabase
