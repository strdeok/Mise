import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import { ko, registerTranslation, TimePickerModal } from 'react-native-paper-dates';
import { palette } from '@/components/mise-ui';

registerTranslation('ko', ko);

const pickerTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: palette.ink,
    onPrimary: palette.bg,
    primaryContainer: palette.line,
    onPrimaryContainer: palette.ink,
    secondary: palette.ink,
    onSecondary: palette.bg,
    secondaryContainer: palette.line,
    onSecondaryContainer: palette.ink,
    tertiary: palette.ink,
    onTertiary: palette.bg,
    tertiaryContainer: palette.line,
    onTertiaryContainer: palette.ink,
    surface: palette.bg,
    onSurface: palette.ink,
    surfaceVariant: palette.line,
    onSurfaceVariant: palette.muted,
    background: palette.bg,
    onBackground: palette.ink,
    outline: palette.muted,
    outlineVariant: palette.line,
    backdrop: 'rgba(0, 0, 0, 0.32)',
    elevation: { ...MD3LightTheme.colors.elevation, level1: palette.card, level2: palette.card, level3: palette.card, level4: palette.card, level5: palette.card },
  },
};

export function MiseTimePicker({ visible, value, label, onDismiss, onConfirm }: { visible: boolean; value: string; label: string; onDismiss: () => void; onConfirm: (value: string) => void }) {
  const [hours, minutes] = value.split(':').map(Number);
  return <PaperProvider theme={pickerTheme}>
    <TimePickerModal
      visible={visible}
      onDismiss={onDismiss}
      onConfirm={({ hours: selectedHours, minutes: selectedMinutes }) => onConfirm(`${String(selectedHours).padStart(2, '0')}:${String(Math.floor(selectedMinutes / 5) * 5).padStart(2, '0')}`)}
      hours={Number.isFinite(hours) ? hours : 9}
      minutes={Number.isFinite(minutes) ? minutes : 0}
      label={label}
      cancelLabel="취소"
      confirmLabel="확인"
      locale="ko"
      use24HourClock
      defaultInputType="picker"
    />
  </PaperProvider>;
}
