@php
    $normalizeFlashMessage = function ($flash) {
        if (is_object($flash) && method_exists($flash, 'get')) {
            return [
                'title' => \Illuminate\Support\Arr::get($flash->get('title'), 0),
                'messages' => array_values(array_filter((array) $flash->get('message'))),
            ];
        }

        if (is_array($flash)) {
            $title = \Illuminate\Support\Arr::get($flash, 'title');
            $message = \Illuminate\Support\Arr::get($flash, 'message', \Illuminate\Support\Arr::get($flash, 0));
            return [
                'title' => is_array($title) ? \Illuminate\Support\Arr::get($title, 0) : $title,
                'messages' => is_array($message) ? array_values($message) : [$message],
            ];
        }

        return ['title' => null, 'messages' => [is_scalar($flash) ? (string) $flash : null]];
    };
@endphp

@if($error = session()->get('error'))
    @php
        $feedback = $normalizeFlashMessage($error);
    @endphp
    @include('admin::partials.modern-alert', ['tone' => 'danger', 'title' => $feedback['title'], 'messages' => $feedback['messages']])
@elseif (($errors = session()->get('errors')) && $errors->hasBag('error'))
    @php
        $messages = [];
        foreach ($errors->getBag('error')->toArray() as $message) {
            $messages[] = \Illuminate\Support\Arr::get($message, 0);
        }
    @endphp
    @include('admin::partials.modern-alert', ['tone' => 'danger', 'title' => null, 'messages' => $messages])
@endif

@if($success = session()->get('success'))
    @php
        $feedback = $normalizeFlashMessage($success);
    @endphp
    @include('admin::partials.modern-alert', ['tone' => 'success', 'title' => $feedback['title'], 'messages' => $feedback['messages']])
@endif

@if($info = session()->get('info'))
    @php
        $feedback = $normalizeFlashMessage($info);
    @endphp
    @include('admin::partials.modern-alert', ['tone' => 'info', 'title' => $feedback['title'], 'messages' => $feedback['messages']])
@endif

@if($warning = session()->get('warning'))
    @php
        $feedback = $normalizeFlashMessage($warning);
    @endphp
    @include('admin::partials.modern-alert', ['tone' => 'warning', 'title' => $feedback['title'], 'messages' => $feedback['messages']])
@endif
