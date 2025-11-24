import { ProjectDashboard } from './ProjectDashboard';

async function getProject(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/projects/${id}`, {
    cache: 'no-store',
  });
  
  if (!res.ok) {
    return null;
  }
  
  const data = await res.json();
  return data.success ? data.data : null;
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Project not found
          </h2>
          <a href="/" className="text-blue-600 hover:underline">
            ← Back to projects
          </a>
        </div>
      </div>
    );
  }

  return <ProjectDashboard project={project} />;
}
