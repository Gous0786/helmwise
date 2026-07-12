{{/*
Common name for resources. Uses nameOverride when set.
*/}}
{{- define "with-helpers.name" -}}
{{- default .Chart.Name .Values.nameOverride -}}
{{- end -}}

{{/*
Fully-qualified name: <release>-<name>.
*/}}
{{- define "with-helpers.fullname" -}}
{{- printf "%s-%s" .Release.Name (include "with-helpers.name" .) -}}
{{- end -}}

{{/*
Common labels. Routes .Values.team into output through this helper, so any
attribution engine that only scans direct {{ .Values.x }} refs in manifests
would miss it — perturbation catches it because it looks at rendered output.
*/}}
{{- define "with-helpers.labels" -}}
app: {{ include "with-helpers.name" . }}
team: {{ .Values.team }}
{{- end -}}
