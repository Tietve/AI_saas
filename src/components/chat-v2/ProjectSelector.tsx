import { FolderIcon, Plus, MoreVertical, Edit, Trash2 } from 'lucide-react'
import { useState } from 'react'
import styles from '@/styles/components/chat/projects.module.css'

interface Project {
    id: string
    name: string
    description?: string
    color?: string
    icon?: string
    conversationCount?: number
    createdAt: string
    updatedAt: string
}

interface ProjectSelectorProps {
    projects: Project[]
    selectedProjectId: string | null
    onSelectProject: (projectId: string | null) => void
    onCreateProject: () => void
    onEditProject?: (project: Project) => void
    onDeleteProject?: (projectId: string) => void
}

export function ProjectSelector({
    projects,
    selectedProjectId,
    onSelectProject,
    onCreateProject,
    onEditProject,
    onDeleteProject
}: ProjectSelectorProps) {
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

    const handleMenuToggle = (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation()
        setMenuOpenId(menuOpenId === projectId ? null : projectId)
    }

    const handleEdit = (e: React.MouseEvent, project: Project) => {
        e.stopPropagation()
        setMenuOpenId(null)
        onEditProject?.(project)
    }

    const handleDelete = (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation()
        setMenuOpenId(null)
        if (confirm('Delete this project? (Conversations will be kept)')) {
            onDeleteProject?.(projectId)
        }
    }

    return (
        <div className={styles.projectSelector}>
            <div className={styles.projectHeader}>
                <span>Projects</span>
                <button
                    onClick={onCreateProject}
                    title="New project"
                    className={styles.newProjectBtn}
                >
                    <Plus size={16} />
                </button>
            </div>

            {/* All Conversations */}
            <button
                className={`${styles.projectItem} ${!selectedProjectId ? styles.active : ''}`}
                onClick={() => onSelectProject(null)}
            >
                <FolderIcon size={16} className={styles.projectIconSvg} />
                <span className={styles.projectName}>All Conversations</span>
            </button>

            {/* Project List */}
            {projects.map(project => (
                <div key={project.id} className={styles.projectItemWrapper}>
                    <button
                        className={`${styles.projectItem} ${selectedProjectId === project.id ? styles.active : ''}`}
                        onClick={() => onSelectProject(project.id)}
                    >
                        <div
                            className={styles.projectIcon}
                            style={{ backgroundColor: project.color || '#3b82f6' }}
                        >
                            {project.icon?.[0] || project.name[0]?.toUpperCase() || 'P'}
                        </div>
                        <div className={styles.projectInfo}>
                            <span className={styles.projectName}>{project.name}</span>
                            {project.conversationCount !== undefined && (
                                <span className={styles.projectCount}>
                                    {project.conversationCount} {project.conversationCount === 1 ? 'chat' : 'chats'}
                                </span>
                            )}
                        </div>

                        {/* Project Menu */}
                        {(onEditProject || onDeleteProject) && (
                            <button
                                className={styles.projectMenuBtn}
                                onClick={(e) => handleMenuToggle(e, project.id)}
                                title="Project options"
                            >
                                <MoreVertical size={14} />
                            </button>
                        )}
                    </button>

                    {/* Dropdown Menu */}
                    {menuOpenId === project.id && (
                        <div className={styles.projectMenu}>
                            {onEditProject && (
                                <button onClick={(e) => handleEdit(e, project)}>
                                    <Edit size={14} />
                                    Edit
                                </button>
                            )}
                            {onDeleteProject && (
                                <button
                                    onClick={(e) => handleDelete(e, project.id)}
                                    className={styles.deleteBtn}
                                >
                                    <Trash2 size={14} />
                                    Delete
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ))}

            {projects.length === 0 && (
                <div className={styles.emptyProjects}>
                    <p>No projects yet</p>
                    <button onClick={onCreateProject}>Create your first project</button>
                </div>
            )}
        </div>
    )
}
