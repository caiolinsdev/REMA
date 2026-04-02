from __future__ import annotations

from typing import Any

from core.models import Submission


def submission_summary_payload(submission: Submission) -> dict[str, Any]:
    return {
        "id": str(submission.id),
        "activityId": str(submission.activity_id),
        "studentId": str(submission.student_id),
        "status": submission.status,
        "submittedAt": submission.submitted_at.isoformat() if submission.submitted_at else None,
        "score": submission.score,
    }


def submission_detail_payload(submission: Submission) -> dict[str, Any]:
    return {
        **submission_summary_payload(submission),
        "answers": [
            {
                "questionId": str(answer.question_id),
                "answerText": answer.answer_text or None,
                "selectedOptionId": str(answer.selected_option_id)
                if answer.selected_option_id
                else None,
            }
            for answer in submission.answers.all()
        ],
        "files": [
            {
                "id": str(file.id),
                "fileName": file.file_name,
                "fileUrl": file.file_url,
                "fileType": file.file_type,
            }
            for file in submission.files.all()
        ],
        "feedback": submission.feedback or None,
    }


def submission_list_item_payload(submission: Submission) -> dict[str, Any]:
    profile = submission.student.profile
    student_name = profile.display_name or submission.student.get_full_name() or submission.student.username
    return {
        **submission_summary_payload(submission),
        "studentName": student_name,
    }
