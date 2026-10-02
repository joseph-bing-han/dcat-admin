export function installFormSerialization($) {
    // 分步表单使用 div 作为字段容器，序列化时仍须遵守成功控件规则。
    $.fn.formToArray ||= function formToArray() {
        return this.find(':input').addBack(':input').serializeArray();
    };
}
