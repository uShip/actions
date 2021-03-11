import { getOctokit } from "@actions/github";

interface PRCommentOptions {
  octokit: ReturnType<typeof getOctokit>;
  owner: string;
  repo: string;
  prId: number;
  context: string;
  body: string;
}

export async function setPRComment({
  owner,
  repo,
  prId,
  context,
  body,
  octokit,
}: PRCommentOptions) {
  const { data: comments } = await octokit.issues.listComments({
    issue_number: prId,
    owner,
    repo,
  });

  const commentId = `uShipActionID: ${context}`;
  const comment = comments.find((comment) => {
    return comment.body?.includes(commentId);
  });

  body = `<!-- ${commentId} -->\n\n` + body;

  if (comment) {
    octokit.issues.updateComment({
      owner,
      repo,
      comment_id: comment.id,
      body,
    });
  } else {
    octokit.issues.createComment({
      issue_number: prId,
      owner,
      repo,
      body,
    });
  }
}
