export function getGradeColor(grade: string | null): string {
  if (!grade) return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50'
  if (grade.startsWith('A')) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
  if (grade.startsWith('B')) return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
  if (grade.startsWith('C')) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
  return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50'
}

