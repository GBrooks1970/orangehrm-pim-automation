import { Text } from '@serenity-js/web';
import { TopBar } from '../interactions/TopBar';

export const CurrentUser = {
    name: () => Text.of(TopBar.userName).describedAs('the signed-in employee name'),
};
