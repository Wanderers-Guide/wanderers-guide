import { ContentSource, PublicUser } from '@typing/content';
import _ from 'lodash-es';
import { defineDefaultSources, fetchContentSources } from './content-store';
import { getPublicUser } from '@auth/user-manager';

export async function updateSubscriptions(user: PublicUser | undefined | null, source: ContentSource, add: boolean) {
  if (!user) return [];

  let subscriptions = add
    ? [
        ...(user.subscribed_content_sources ?? []).filter((src) => src.source_id !== source?.id),
        { source_id: source.id, source_name: source.name, added_at: `${new Date().getTime()}` },
      ]
    : user.subscribed_content_sources?.filter((src) => src.source_id !== source?.id);
  subscriptions = _.uniq(subscriptions);

  const sources = await fetchContentSources({ ids: subscriptions.map((s) => s.source_id) });
  subscriptions = subscriptions.filter((s) => sources.find((src) => src.id === s.source_id));
  return subscriptions;
}

export async function defineDefaultSourcesForSource(source: ContentSource) {
  const allSources = await fetchContentSources({ homebrew: false, ids: 'all' });
  const user = await getPublicUser();
  // TODO: change to only the bundle's required sources
  defineDefaultSources([
    ...allSources.map((source) => source.id), // shouldn't be needed
    ...(user?.subscribed_content_sources?.map((s) => s.source_id) ?? []), // shouldn't be needed
    ...(source.required_content_sources ?? []),
    source.id,
  ]);
}
