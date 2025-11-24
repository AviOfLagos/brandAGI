import { LogsPageClient } from './LogsPageClient';

async function getLogs(projectId?: string) {
  try {
    const url = projectId 
      ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/logs?projectId=${projectId}&limit=100`
      : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/logs?limit=100`;
      
    const res = await fetch(url, { cache: 'no-store' });
    
    if (!res.ok) return [];
    
    const data = await res.json();
    return data.success ? data.data.logs : [];
  } catch {
    return [];
  }
}

export default async function LogsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ projectId?: string }> 
}) {
  const { projectId } = await searchParams;
  const logs = await getLogs(projectId);

  return <LogsPageClient initialLogs={logs} initialProjectId={projectId} />;
}
