(require 'cl-lib)

(defun get-canopy-element-list ()
  (canopy-company-filter company-prefix
                         (list "#total"
                               "#average"
                               "#current"
                               "#hole-number"
                               "#hole"
                               "#color-name"
                               "#swing")))

(defun canopy-ac/company-backend (command &optional arg &rest ignored)
  (interactive (list 'interactive))
  (cl-case command
    (interactive (company-begin-backend 'canopy-ac/company-backend))
    (prefix (canopy-grab-word))
    (ignore-case 't)
    (candidates (get-canopy-element-list))))


(defun canopy-company-filter (prefix candidates)
 (if prefix
   (cl-loop for candidate in candidates
            when (string-prefix-p prefix candidate 't)
            collect candidate)))

(defun canopy-grab-word ()
"Select the word under cursor.
“word” here is considered any alphanumeric sequence with “_” or “-”."
(interactive)
(let (pt)
  (skip-chars-backward "#-_A-Za-z0-9")
  (setq pt (point))
  (skip-chars-forward "#-_A-Za-z0-9")
  (buffer-substring-no-properties pt (point))))

(canopy-grab-word)

foobar hello
