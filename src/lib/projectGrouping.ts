import type { Project } from '../types';

export interface ProjectGroup {
  groupId: string;
  projects: Project[];
  primaryProject: Project;
  versionCount: number;
  totalValue: number;
  latestDate: string;
}

export function groupProjectsByGroupId(projects: Project[]): ProjectGroup[] {
  const groupsMap = new Map<string, Project[]>();

  projects.forEach(project => {
    const key = project.group_id || project.id;

    if (!groupsMap.has(key)) {
      groupsMap.set(key, []);
    }

    groupsMap.get(key)!.push(project);
  });

  const groups: ProjectGroup[] = [];

  groupsMap.forEach((projectsInGroup, groupId) => {
    const sortedProjects = projectsInGroup.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const primaryProject = sortedProjects[0];
    const totalValue = projectsInGroup.reduce((sum, p) => sum + p.total_amount, 0);
    const latestDate = sortedProjects[0].created_at;

    groups.push({
      groupId,
      projects: sortedProjects,
      primaryProject,
      versionCount: projectsInGroup.length,
      totalValue,
      latestDate,
    });
  });

  return groups.sort((a, b) =>
    new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime()
  );
}

export function getProjectVersionNumber(project: Project, allProjects: Project[]): number {
  if (!project.group_id) return 1;

  const groupProjects = allProjects
    .filter(p => p.group_id === project.group_id)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const index = groupProjects.findIndex(p => p.id === project.id);
  return index + 1;
}

export function extractBaseName(projectName: string): string {
  const versionPattern = / - v\d+$/;
  const copyPattern = / \(Copy\)$/;
  const importedPattern = / \(Imported\)$/;

  return projectName
    .replace(versionPattern, '')
    .replace(copyPattern, '')
    .replace(importedPattern, '')
    .trim();
}
