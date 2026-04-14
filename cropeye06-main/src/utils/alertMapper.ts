export type AlertCategory =
  | 'pest'
  | 'disease'
  | 'spray'
  | 'growth'
  | 'health'
  | 'canopy'
  | 'ripening'
  | 'irrigation'
  | 'harvest'
  | 'fertilizer'
  | 'nutrient'
  | 'general';

export type AlertSeverity = 'low' | 'moderate' | 'high';

export interface NormalizedAlert {
  id: number;
  type: AlertCategory;
  title: string;
  message: string;
  severity: AlertSeverity;
  timestamp: string;
  is_read: boolean;
  extraData?: Record<string, unknown>;
}

// Ensure Type matches the NotificationRow in FarmerInfoBar
export type NotificationRow = {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  task_id: number | null;
  task_title: string | null;
  notification_type: string;
  metadata: Record<string, unknown>;
};

export function mapBackendNotificationToAlert(row: NotificationRow): NormalizedAlert {
  let type: AlertCategory = 'general';
  let severity: AlertSeverity = 'moderate';
  let title = row.task_title || 'Notification';
  let message = row.message;

  const msgLower = row.message.toLowerCase();
  const titleLower = title.toLowerCase();
  const rawType = row.notification_type || '';

  // 1. Determine Category based on keywords
  if (
    rawType.includes('pest') ||
    msgLower.includes('pest') ||
    msgLower.includes('mealybug') ||
    msgLower.includes('thrips') ||
    msgLower.includes('mite')
  ) {
    type = 'pest';
  } else if (
    rawType.includes('disease') ||
    msgLower.includes('disease') ||
    msgLower.includes('mildew') ||
    msgLower.includes('anthracnose') ||
    msgLower.includes('rot')
  ) {
    type = 'disease';
  } else if (
    msgLower.includes('spray') ||
    msgLower.includes('chemical') ||
    msgLower.includes('fungicide') ||
    msgLower.includes('insecticide')
  ) {
    type = 'spray';
  } else if (
    msgLower.includes('growth') ||
    msgLower.includes('flowering') ||
    msgLower.includes('vegetative')
  ) {
    type = 'growth';
  } else if (msgLower.includes('ndvi') || msgLower.includes('ndwi') || msgLower.includes('crop health')) {
    type = 'health';
  } else if (msgLower.includes('canopy')) {
    type = 'canopy';
  } else if (msgLower.includes('ripening') || msgLower.includes('brix')) {
    type = 'ripening';
  } else if (msgLower.includes('irrigation') || msgLower.includes('moisture') || msgLower.includes('water')) {
    type = 'irrigation';
  } else if (msgLower.includes('harvest')) {
    type = 'harvest';
  } else if (msgLower.includes('fertilizer') || msgLower.includes('manure')) {
    type = 'fertilizer';
  } else if (
    msgLower.includes('nutrient') ||
    msgLower.includes('nitrogen') ||
    msgLower.includes('potassium') ||
    msgLower.includes('deficiency')
  ) {
    type = 'nutrient';
  }

  // 2. Determine Severity
  if (
    msgLower.includes('high') ||
    msgLower.includes('severe') ||
    msgLower.includes('critical') ||
    msgLower.includes('alert') ||
    msgLower.includes('danger')
  ) {
    severity = 'high';
  } else if (
    msgLower.includes('low') ||
    msgLower.includes('good') ||
    msgLower.includes('healthy') ||
    msgLower.includes('normal')
  ) {
    severity = 'low';
  }

  // 3. Smart Messaging Overrides
  if (msgLower.includes('ndwi low')) {
    message = 'Crop health is poor. Check irrigation and nutrients.';
    severity = 'high';
  } else if (msgLower.includes('temperature') && msgLower.includes('high')) {
    message = 'Heat stress detected. Increase irrigation.';
    severity = 'high';
  }

  // If it's a task, let's format it nicer
  if (row.task_id) {
    title = `Task: ${title}`;
    if (!message) {
      if (type === 'spray') message = 'New spraying task assigned. Please follow recommendations.';
      else if (type === 'irrigation') message = 'Irrigation task assigned based on recent moisture data.';
      else message = 'You have a new standard task assigned by your field officer.';
    }
  }

  return {
    id: row.id,
    type,
    title,
    message,
    severity,
    timestamp: row.created_at,
    is_read: row.is_read,
    extraData: row.metadata,
  };
}
