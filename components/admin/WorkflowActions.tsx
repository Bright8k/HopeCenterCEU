import { View } from 'react-native';
import { Button } from '@/components/ui/Button';

type CourseStatus = 'draft' | 'pending_review' | 'published' | 'archived';
type ReviewAction = 'submit' | 'approve' | 'reject' | 'archive' | 'unarchive';

const ROW = { flexDirection: 'row' as const, gap: 10, marginTop: 12, marginBottom: 4 };

export function WorkflowActions({
  status,
  loading,
  onAction,
}: {
  status: CourseStatus;
  loading: boolean;
  onAction: (action: ReviewAction, note?: string) => void;
}) {
  if (status === 'draft') {
    return (
      <View style={ROW}>
        <Button title={loading ? 'Submitting…' : 'Submit for Review'} onPress={() => onAction('submit')} loading={loading} variant="outline" accessibilityLabel="Submit this course for admin review" />
      </View>
    );
  }
  if (status === 'pending_review') {
    return (
      <View style={ROW}>
        <Button title={loading ? 'Working…' : 'Approve & Publish'} onPress={() => onAction('approve')} loading={loading} style={{ flex: 1 }} accessibilityLabel="Approve and publish this course" />
        <Button title="Return to Draft" onPress={() => onAction('reject')} disabled={loading} variant="outline" style={{ flex: 1 }} accessibilityLabel="Return course to draft status" />
      </View>
    );
  }
  if (status === 'published') {
    return (
      <View style={ROW}>
        <Button title={loading ? 'Working…' : 'Archive Course'} onPress={() => onAction('archive')} loading={loading} variant="outline" accessibilityLabel="Archive this course — removes it from the learner library" />
      </View>
    );
  }
  if (status === 'archived') {
    return (
      <View style={ROW}>
        <Button title={loading ? 'Working…' : 'Restore as Draft'} onPress={() => onAction('unarchive')} loading={loading} variant="outline" accessibilityLabel="Restore archived course to draft" />
      </View>
    );
  }
  return null;
}
