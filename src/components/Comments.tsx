import { DiscussionEmbed } from "disqus-react";

interface Props {
  shortname: string;
  config: Config;
}

interface Config {
  url?: string;
  identifier?: string;
  title?: string;
  language?: string;
}

export default function Comments({ shortname, config }: Props) {
  return <DiscussionEmbed shortname={shortname} config={config} />;
}
